import { ux } from '@cto.ai/sdk'
import * as util from 'util'
import * as childProcess from 'child_process'
import * as yaml from 'yaml'
import {
  asyncPipe,
  displayClustersFromConfig,
  writeToFileSync,
  generateProgressBar,
  clusterRSAExists,
  saveSshToKnownHosts,
} from '../utils'
import { awsSetup } from '../utils/aws'
import { Config, ClusterDetails, UpdatePipeline, UpdateAnswers } from '../types'
import { readConfig } from '../utils/config'
import {
  confirmUpgradeKubernetesVersionQuestion,
  ConfirmUpgradeKubernetesVersionAnswers,
  upgradeKubernetesVersionQuestion,
  UpgradeKubernetesVersionAnswers,
  confirmChangeWorkerNodeCountQuestion,
  ConfirmChangeWorkerNodeCountAnswers,
  changeWorkerNodeCountQuestion,
  ChangeWorkerNodeCountAnswers,
  confirmChangeInstanceSizeQuestion,
  ConfirmChangeInstanceSizeAnswers,
  changeInstanceSizeQuestion,
  ChangeInstanceSizeAnswers,
  clusterQuestions,
  ClusterAnswers,
} from '../questions'
import { AWS_DIR, PRIVATE_TOPOLOGY, CREDS_DIR } from '../constants'

const pExec = util.promisify(childProcess.exec)
const BASTION_ROOT_FOLDER = '/home/admin'

const getRootFolder = (isPrivate: boolean) => {
  return isPrivate ? BASTION_ROOT_FOLDER : '/ops'
}

/**
 * TODO 2: Make sure this works for all cases

 * TODO 3: Implement rollback

 * TODO 4: Since the bastion will die when upgrading kubernetes version, create an
 * updater node living in the same VPC that doesn't get destroyed. This needs to be done
 * so that we know the update is finished
 */

// 5 minutes is required because of the time it takes to restart the cluster with the correct configs
const UPDATE_CLUSTER_TIMEOUT = 5e5

const execWithTopology = async (
  sshScript: string,
  isPrivate: boolean,
  body: string,
) => {
  const command = isPrivate ? `${sshScript} "${body}"` : body

  return pExec(command)
}

const askUpgradeKubernetesVersion = async (): Promise<string> => {
  const { shouldChangeKubernetesVersion } = (await ux.prompt(
    confirmUpgradeKubernetesVersionQuestion,
  )) as ConfirmUpgradeKubernetesVersionAnswers
  if (!shouldChangeKubernetesVersion) return ''
  const { kubernetesVersion } = (await ux.prompt(
    upgradeKubernetesVersionQuestion,
  )) as UpgradeKubernetesVersionAnswers
  return kubernetesVersion
}

const askChangeWorkerNodeCount = async (): Promise<string> => {
  const { shouldChangeWorkerNodeCount } = (await ux.prompt(
    confirmChangeWorkerNodeCountQuestion,
  )) as ConfirmChangeWorkerNodeCountAnswers
  if (!shouldChangeWorkerNodeCount) return ''
  const { numWorkerNodes } = (await ux.prompt(
    changeWorkerNodeCountQuestion,
  )) as ChangeWorkerNodeCountAnswers
  return numWorkerNodes
}

const askChangeInstanceSize = async (): Promise<string> => {
  const { shouldChangeInstanceSize } = (await ux.prompt(
    confirmChangeInstanceSizeQuestion,
  )) as ConfirmChangeInstanceSizeAnswers
  if (!shouldChangeInstanceSize) return ''
  const { nodeInstanceSize } = (await ux.prompt(
    changeInstanceSizeQuestion,
  )) as ChangeInstanceSizeAnswers
  return nodeInstanceSize
}

const askQuestions = async (): Promise<UpdatePipeline> => {
  const configs: Config = await readConfig()

  const mappedClusters = displayClustersFromConfig(configs)

  let clusterDetails: ClusterDetails

  if (!configs.clusters || !configs.clusters.length) {
    const { name, topology, region, domain } = (await ux.prompt(
      clusterQuestions,
    )) as ClusterAnswers
    clusterDetails = {
      name,
      region,
      domain,
      isPrivate: topology === PRIVATE_TOPOLOGY,
    }
  } else {
    ;({ clusterDetails } = await ux.prompt([
      {
        type: 'list',
        name: 'clusterDetails',
        message: `Which cluster would you like to update?`,
        choices: mappedClusters,
        afterMessage: `${ux.colors.reset.green('✔')} Cluster`,
        afterMessageAppend: `${ux.colors.reset(' selected!')}`,
      },
    ]))

    if (clusterDetails.isPrivate && !clusterRSAExists) {
      const missingClusterRSAError = `\n‼️ Credentials not found. Please check you have the appropriate ssh key pair in ~/creds or contact your administrator for access.`
      console.log(missingClusterRSAError)
      process.exit(1)
    }
  }

  // This is commented because of complications regarding changing the kubernetes version
  // const kubernetesVersion = await askUpgradeKubernetesVersion()
  const kubernetesVersion = ''
  const numWorkerNodes = await askChangeWorkerNodeCount()
  const nodeInstanceSize = await askChangeInstanceSize()

  return {
    sshScript: '',
    configs,
    answers: {
      kubernetesVersion,
      numWorkerNodes,
      nodeInstanceSize,
    },
    clusterDetails,
  }
}

// TODO: Use the util `saveSshToKnownHosts`
/**
 * @returns the SSH script that can be used to SSH to the bastion server
 */
const getSshCredsToBastion = async ({
  clusterDetails,
  ...rest
}: UpdatePipeline) => {
  if (!clusterDetails.isPrivate)
    return {
      ...rest,
      sshScript: '',
      clusterDetails,
    }

  const clusterName = `${clusterDetails.name}.${clusterDetails.domain}`
  saveSshToKnownHosts(clusterName)

  const sshScript = `ssh -i ${CREDS_DIR}/cluster_rsa admin@bastion.${clusterName}`

  return {
    ...rest,
    sshScript,
    clusterDetails,
  }
}

const copyAwsCreds = async ({
  sshScript,
  clusterDetails,
  ...rest
}: UpdatePipeline) => {
  const { name, domain, isPrivate } = clusterDetails
  if (!isPrivate) return { ...rest, sshScript, clusterDetails }

  const removeAwsCreds = `rm -rf ${getRootFolder(isPrivate)}/.aws`
  await execWithTopology(sshScript, isPrivate, removeAwsCreds).catch(() => {})

  const createAwsFolder = `mkdir ${getRootFolder(isPrivate)}/.aws`
  await execWithTopology(sshScript, isPrivate, createAwsFolder)

  if (clusterDetails.isPrivate) {
    const copyAwsFolder = `scp -i ${CREDS_DIR}/cluster_rsa ${AWS_DIR}/* admin@bastion.${name}.${domain}:/home/admin/.aws`
    await pExec(copyAwsFolder)
  }

  return {
    ...rest,
    sshScript,
    clusterDetails,
  }
}

const createKubernetesFolder = async ({
  sshScript,
  clusterDetails,
  ...rest
}: UpdatePipeline) => {
  const { isPrivate } = clusterDetails
  const removeDirectory = `rm -rf ${getRootFolder(isPrivate)}/kubernetes`
  await execWithTopology(sshScript, isPrivate, removeDirectory)

  const makeDirectory = `mkdir ${getRootFolder(isPrivate)}/kubernetes`
  await execWithTopology(sshScript, isPrivate, makeDirectory)

  return { ...rest, sshScript, clusterDetails }
}

const getClusterYaml = async (
  sshScript: string,
  kopsStateStore: string,
  clusterDetails: ClusterDetails,
  answers: UpdateAnswers,
): Promise<string> => {
  const { isPrivate, name, domain } = clusterDetails
  const { kubernetesVersion } = answers
  try {
    const getClusterYaml = `kops get cluster -oyaml --name ${name}.${domain} --state ${kopsStateStore}`
    const { stdout } = await execWithTopology(
      sshScript,
      isPrivate,
      getClusterYaml,
    )

    const rawClusterYaml = yaml.parse(stdout)
    if (kubernetesVersion) {
      rawClusterYaml.spec.kubernetesVersion = kubernetesVersion
    }
    return rawClusterYaml ? yaml.stringify(rawClusterYaml) : ''
  } catch (error) {
    console.error('Error in getting raw cluster yaml: ', error.message)
    return ''
  }
}

const getMasterYaml = async (
  sshScript: string,
  kopsStateStore: string,
  clusterDetails: ClusterDetails,
): Promise<string> => {
  const { isPrivate, name, domain } = clusterDetails
  try {
    const getMasterYaml = `kops get ig master -oyaml --name ${name}.${domain} --state ${kopsStateStore}`
    const { stdout } = await execWithTopology(
      sshScript,
      isPrivate,
      getMasterYaml,
    )
    return stdout
  } catch (error) {
    return ''
  }
}

const getNodesYaml = async (
  sshScript: string,
  kopsStateStore: string,
  clusterDetails: ClusterDetails,
  answers: UpdateAnswers,
): Promise<string> => {
  const { isPrivate, name, domain } = clusterDetails
  const { numWorkerNodes, nodeInstanceSize } = answers
  try {
    const getNodesYaml = `kops get ig nodes -oyaml --name ${name}.${domain} --state ${kopsStateStore}`
    const { stdout } = await execWithTopology(
      sshScript,
      isPrivate,
      getNodesYaml,
    )
    const rawNodesYaml = yaml.parse(stdout)
    if (numWorkerNodes) {
      rawNodesYaml.spec.maxSize = parseInt(numWorkerNodes, 10)
      rawNodesYaml.spec.minSize = parseInt(numWorkerNodes, 10)
    }
    if (nodeInstanceSize) {
      rawNodesYaml.spec.machineType = nodeInstanceSize
    }
    return rawNodesYaml ? yaml.stringify(rawNodesYaml) : ''
  } catch (error) {
    return ''
  }
}

const generateFinalYaml = async (
  sshScript: string,
  clusterDetails: ClusterDetails,
  clusterYaml: string,
  masterYaml: string,
  nodesYaml: string,
) => {
  const { isPrivate } = clusterDetails
  const reCreateKopsClusterYaml = `rm ${getRootFolder(
    isPrivate,
  )}/kubernetes/kops-full-cluster.yaml && touch ${getRootFolder(
    isPrivate,
  )}/kubernetes/kops-full-cluster.yaml`
  const echoBreakLine = `echo '---' >> ${getRootFolder(
    isPrivate,
  )}/kubernetes/kops-full-cluster.yaml`
  const echoClusterYaml = `echo '${clusterYaml}' >> ${getRootFolder(
    isPrivate,
  )}/kubernetes/kops-full-cluster.yaml`
  const echoMasterYaml = `echo '${masterYaml}' >> ${getRootFolder(
    isPrivate,
  )}/kubernetes/kops-full-cluster.yaml`
  const echoNodesYaml = `echo '${nodesYaml}' >> ${getRootFolder(
    isPrivate,
  )}/kubernetes/kops-full-cluster.yaml`

  await execWithTopology(sshScript, isPrivate, reCreateKopsClusterYaml).catch(
    () => {},
  )
  await execWithTopology(sshScript, isPrivate, echoClusterYaml)

  if (masterYaml) {
    await execWithTopology(sshScript, isPrivate, echoBreakLine)
    await execWithTopology(sshScript, isPrivate, echoMasterYaml)
  }

  if (nodesYaml) {
    await execWithTopology(sshScript, isPrivate, echoBreakLine)
    await execWithTopology(sshScript, isPrivate, echoNodesYaml)
  }
}

/**
 * Obtained from https://github.com/kubernetes/kops/issues/1732
 */
const writeYamls = async ({
  sshScript,
  answers,
  clusterDetails,
  ...rest
}: UpdatePipeline) => {
  const { name, domain } = clusterDetails
  const kopsStateStore = `s3://${name}.${domain}`

  // Gets the individual yamls
  const clusterYaml = await getClusterYaml(
    sshScript,
    kopsStateStore,
    clusterDetails,
    answers,
  )
  const masterYaml = await getMasterYaml(
    sshScript,
    kopsStateStore,
    clusterDetails,
  )
  const nodesYaml = await getNodesYaml(
    sshScript,
    kopsStateStore,
    clusterDetails,
    answers,
  )

  // Cluster Yaml must exist for the cluster to be updated
  if (!clusterYaml)
    throw new Error(
      `Could not get configs from cluster. Please confirm it exists and it's public`,
    )

  await generateFinalYaml(
    sshScript,
    clusterDetails,
    clusterYaml,
    masterYaml,
    nodesYaml,
  )

  return {
    ...rest,
    sshScript,
    answers,
    clusterDetails,
  }
}

const updateCluster = async ({
  sshScript,
  clusterDetails,
  ...rest
}: UpdatePipeline) => {
  const { name, domain, isPrivate } = clusterDetails
  const kopsStateStore = `s3://${name}.${domain}`

  const replaceKopsConfig = `kops replace -f ${getRootFolder(
    isPrivate,
  )}/kubernetes/kops-full-cluster.yaml --state ${kopsStateStore}`
  await execWithTopology(sshScript, isPrivate, replaceKopsConfig)

  console.log('\n')
  ux.spinner.start('Applying the updates to the cluster')
  const updateClusterCommand = `kops update cluster --yes --name ${name}.${domain} --state ${kopsStateStore}`
  await execWithTopology(sshScript, isPrivate, updateClusterCommand).catch(
    err => {
      console.error(err)
    },
  )
  ux.spinner.stop('Done')

  ux.spinner.start('Terminating and rebooting the cluster')
  const rollingUpdateClusterCommand = `kops rolling-update cluster --yes --name ${name}.${domain} --state ${kopsStateStore}`
  await execWithTopology(
    sshScript,
    isPrivate,
    rollingUpdateClusterCommand,
  ).catch(() => {})
  ux.spinner.stop('Done')

  console.log('\nValidating the newly-rebooted cluster...')
  await generateProgressBar(UPDATE_CLUSTER_TIMEOUT)

  console.log(`🏁 Great! Your cluster is now ready.`)

  return {
    ...rest,
    sshScript,
    clusterDetails,
  }
}

export const update = async () => {
  try {
    const updatePipeline = asyncPipe(
      awsSetup,
      askQuestions,
      getSshCredsToBastion,
      copyAwsCreds,
      createKubernetesFolder,
      writeYamls,
      updateCluster,
    )

    await updatePipeline({})
    process.exit()
  } catch (err) {
    console.log(err.message)
    process.exit(1)
  }
}
