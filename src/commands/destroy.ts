import { ux } from '@cto.ai/sdk'
import * as util from 'util'
import * as fs from 'fs-extra'
import * as childProcess from 'child_process'
import * as path from 'path'
import { awsSetup, writeRegion } from '../utils/aws'
import { readConfig, writeConfig } from '../utils/config'
import {
  OPS_DIR,
  AWS_DIR,
  DEFAULT_PUBLIC_DOMAIN,
  PRIVATE_TOPOLOGY,
  PUBLIC_TOPOLOGY,
  CONFIG_DIR,
} from '../constants'
import {
  DestroyPipeline,
  DestroyAnswers,
  Config,
  AwsResourceRecordSets,
  AwsResourceRecordSet,
  AwsHostedZones,
} from '../types/index'
import { asyncPipe, writeToFileSync, displayClustersFromConfig } from '../utils'
import {
  clusterQuestions,
  ClusterAnswers,
  clusterDetailsQuestions,
  ClusterDetailsAnswers,
  validationPromptQuestions,
  ValidationPromptAnswers,
} from '../questions'

const pExec = util.promisify(childProcess.exec)

const nsRecordDeleteFileName = 'nsRecordDelete.json'

const getHostedZoneIdByName = async (hostedZoneName: string) => {
  const command = 'aws route53 list-hosted-zones'
  const { stdout, stderr } = await pExec(command)

  if (stderr) console.error('stderr: ', stderr)

  const { HostedZones: hostedZones }: AwsHostedZones = JSON.parse(stdout)
  const desiredHostedZone = hostedZones.find(
    zone => zone.Name === `${hostedZoneName}.`,
  )

  if (!desiredHostedZone || !desiredHostedZone.Id) {
    console.error(`Cannot find hosted zone with name ${hostedZoneName}`)
    return ''
  }

  return desiredHostedZone.Id.split('/')[2]
}

const deleteHostedZoneById = async ({ name, domain }: DestroyAnswers) => {
  const deletedHostedZoneId = await getHostedZoneIdByName(`${name}.${domain}`)
  const command = `aws route53 delete-hosted-zone --id ${deletedHostedZoneId}`
  const { stderr } = await pExec(command)

  if (stderr) console.error('stderr :', stderr)
}

const writeNsRecordSetsToFile = (desiredNsRecordSet: AwsResourceRecordSet) => {
  /**
   * Structures the JSON file in the way that AWS CLI expects
   */
  const dnsDelete = {
    Comment: 'Deletes the hosted zone record on parent domain',
    Changes: [
      {
        Action: 'DELETE',
        ResourceRecordSet: desiredNsRecordSet,
      },
    ],
  }

  writeToFileSync({
    dirPath: OPS_DIR,
    fileName: nsRecordDeleteFileName,
    data: JSON.stringify(dnsDelete, null, 2),
  })
}

const getNsRecordSetsFromParent = async (
  answers: DestroyAnswers,
  parentHostedZoneId: string,
) => {
  const { name, domain } = answers

  /**
   * Lists the resource record sets on the parent hosted zone
   */
  const command = `aws route53 list-resource-record-sets --hosted-zone-id ${parentHostedZoneId}`
  const { stdout, stderr } = await pExec(command)
  if (stderr) console.error('stderr :', stderr)

  /**
   * Gets the desired record set on the parent domain
   */
  const {
    ResourceRecordSets: resourceRecordSets,
  }: AwsResourceRecordSets = JSON.parse(stdout)

  const desiredResourceRecordSet = resourceRecordSets.find(
    rrs => rrs.Name === `${name}.${domain}.`,
  )

  if (!desiredResourceRecordSet)
    throw new Error('Cannot find desired resource record set')

  return desiredResourceRecordSet
}

const deleteNsRecordFromParent = async (
  parentHostedZoneId: string,
  answers: DestroyAnswers,
) => {
  /**
   * Gets the aws resource record set and save it to a JSON file
   */
  const desiredNsRecordSet: AwsResourceRecordSet = await getNsRecordSetsFromParent(
    answers,
    parentHostedZoneId,
  )
  writeNsRecordSetsToFile(desiredNsRecordSet)

  /**
   * Reads the JSON file we saved earlier, and deletes the dns entries on the parent domain
   */
  const command = `aws route53 change-resource-record-sets --hosted-zone-id ${parentHostedZoneId} --change-batch file://${nsRecordDeleteFileName}`
  const { stderr } = await pExec(command)
  if (stderr) console.error('stderr :', stderr)
}

const deleteHostedZone = async (answers: DestroyAnswers) => {
  ux.spinner.start('Destroying Hosted Zone')
  const { domain } = answers
  const parentHostedZoneId = await getHostedZoneIdByName(domain)

  /**
   * Deletes the NS record from the parent host
   */
  await deleteNsRecordFromParent(parentHostedZoneId, answers).catch(() => {
    console.error('Failed to delete NS Record from parent')
  })

  /**
   * Delete the Hosted Zone from Route53
   */
  await deleteHostedZoneById(answers).catch(() => {
    console.error('Failed to delete hosted zone')
  })

  ux.spinner.stop('Finished destroying Hosted Zone!')
}

const deleteS3Bucket = async () => {
  ux.spinner.start('Destroying S3 config bucket on AWS')
  const command = 'bash src/cluster-deletion/cluster-delete-s3.sh'
  await pExec(command)
    .then(res => {
      ux.spinner.stop('Successfully destroyed s3 bucket!')
    })
    .catch(err => {
      console.log('Failed to delete from S3 bucket!')
    })
}

const deleteKopsCluster = async () => {
  ux.spinner.start('Destroying kubernetes cluster on AWS')
  const command = 'bash src/cluster-deletion/cluster-delete-kops.sh'
  await pExec(command)
    .then(res => {
      ux.spinner.stop('Successfully destroyed kops cluster!')
    })
    .catch(err => {
      console.log('Failed to destroy the kops cluster!')
    })
}

// Runs the `kops` command to destroy the cluster
// The name is stored in the config
const destroyClusterWithName = async ({
  answers,
  ...rest
}: DestroyPipeline) => {
  await deleteKopsCluster()
  await deleteS3Bucket()

  const { topology } = answers
  if (topology === 'private') await deleteHostedZone(answers)

  return { answers, ...rest }
}

const generateSelectClusterQuestions = async (
  configs: Config,
): Promise<DestroyAnswers> => {
  const { clusters } = configs
  if (!clusters || !clusters.length) {
    const { name, domain, topology, region, confirm } = (await ux.prompt(
      clusterQuestions,
    )) as ClusterAnswers
    return { name, domain, topology, region, confirm }
  }

  // Formats the data such that Inquirer understands it.
  const mappedClusters = displayClustersFromConfig(configs)

  // Make the destroy cluster selectable
  const { clusterDetails } = (await ux.prompt(
    clusterDetailsQuestions(mappedClusters),
  )) as ClusterDetailsAnswers

  // Give confirmation on delete cluster
  const { confirm } = (await ux.prompt(
    validationPromptQuestions(clusterDetails),
  )) as ValidationPromptAnswers

  return {
    ...clusterDetails,
    topology: clusterDetails.isPrivate ? PRIVATE_TOPOLOGY : PUBLIC_TOPOLOGY,
    confirm: !!confirm,
  }
}

const askQuestions = async () => {
  const configs: Config = await readConfig()

  const answers: DestroyAnswers = await generateSelectClusterQuestions(configs)

  if (!answers.confirm) {
    console.log('❌ Destroy cluster cancelled')
    process.exit()
  }

  if (!answers.name) {
    console.log('❌ please enter a cluster name that you want to delete')
    process.exit()
  }

  return {
    answers: { ...answers, domain: answers.domain || DEFAULT_PUBLIC_DOMAIN },
    configs,
  }
}

const configSetup = async ({ answers, configs }: DestroyPipeline) => {
  const { domain, name, region } = answers
  const setupConfig = `
#Required Variables
CLUSTER_NAME=${name}
DOMAIN=${domain}
AWS_DEFAULT_REGION=${region}

DELETE_S3_BUCKET=true
DELETE_CLUSTER=true

KOPS_STATE_STORE=s3://${name}.${domain}
KOPS_BIN=/usr/local/bin/kops`

  writeToFileSync({
    dirPath: OPS_DIR,
    fileName: 'cluster-delete.cfg',
    data: setupConfig,
  })

  return { answers, configs }
}

// TODO: Put all these in a helper file instead
export const getConfigDir = ({
  name,
  domain,
  region,
}: {
  name: string
  domain: string
  region: string
}) => {
  return path.resolve(CONFIG_DIR, 'configs', `${name}.${domain}-${region}`)
}

const removeClusterDetails = async ({
  configs,
  answers,
  ...rest
}: DestroyPipeline) => {
  const { clusters } = configs
  const { name, domain, topology, region } = answers

  if (clusters && clusters.length) {
    const isClusterPrivate = topology === PRIVATE_TOPOLOGY
    const newClusterConfig = clusters.filter(cluster => {
      return (
        cluster.name !== name ||
        cluster.domain !== domain ||
        cluster.region !== region ||
        cluster.isPrivate !== isClusterPrivate
      )
    })
    await writeConfig({ clusters: newClusterConfig })

    if (topology === PUBLIC_TOPOLOGY) {
      const desiredCluster = clusters.find(cluster => {
        return (
          cluster.name === name &&
          cluster.domain === domain &&
          cluster.region === region &&
          cluster.isPrivate === isClusterPrivate
        )
      })

      if (desiredCluster && desiredCluster.name) {
        const configPath = getConfigDir(desiredCluster)
        await fs.remove(configPath)
      }
    }
  }

  return { ...rest, configs, answers }
}

const setRegion = async ({ answers, ...rest }: DestroyPipeline) => {
  await writeRegion(answers.region, AWS_DIR)
  return { ...rest, answers }
}

const setConfigsIfNotPresent = async (destroyPipeline: DestroyPipeline) => {
  const configs: Config = destroyPipeline.configs || (await readConfig())
  return {
    ...destroyPipeline,
    ...configs,
  }
}

export const destroyCluster = async () => {
  try {
    const destroyPipeline = asyncPipe(
      awsSetup,
      askQuestions,
      setConfigsIfNotPresent,
      setRegion,
      configSetup,
      destroyClusterWithName,
      removeClusterDetails,
    )

    await destroyPipeline({})
    process.exit()
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}

export const writeConfigAndDestroyCluster = async (answers: DestroyAnswers) => {
  try {
    const destroyPipeline = asyncPipe(
      setConfigsIfNotPresent,
      setRegion,
      configSetup,
      destroyClusterWithName,
      removeClusterDetails,
    )

    const config: Config = await readConfig()
    await destroyPipeline({ answers, config })
    process.exit()
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}
