import * as yaml from 'yaml'
import * as util from 'util'
import * as childProcess from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { ux } from '@cto.ai/sdk'
import {
  asyncPipe,
  writeToFileSync,
  pExecWithLogs,
  generateProgressBar,
  readConfig,
  saveSshToKnownHosts,
  clusterRSAExists,
  sshKeyGenIfNotExists,
} from '../utils'
import {
  IDeployment,
  IServicePort,
  IContainerPort,
  IAnswers,
  IApiVersions,
  IResource,
  IKinds,
  Config,
  ClusterDetails,
  MappedClusters,
} from '../types/index'
import {
  MANIFESTS_DIR,
  CONFIG_DIR,
  KUBE_DIR,
  PRIVATE_TOPOLOGY,
  PUBLIC_TOPOLOGY,
} from '../constants'
import {
  ResourceAnswers,
  selectClusterQuestions,
  SelectClusterAnswers,
  resourcesQuestions,
} from '../questions'
import { getConfigDir } from './destroy'

const pExec = util.promisify(childProcess.exec)
const FIVE_SEC = 5000

const apiVersions: IApiVersions = {
  V1: 'v1',
  APP_V1: 'apps/v1',
  V1_BETA_1: 'extensions/v1beta1',
}

const kinds: IKinds = {
  DEPLOYMENT: 'Deployment',
  INGRESS: 'Ingress',
  SERVICE: 'Service',
}

const clusterSetup: ({}) => Promise<Config> = async ({}) => {
  const { clusters, ...rest }: Config = await readConfig()

  if (!clusters || !clusters.length) {
    console.log(
      `\n🤔 It looks like you have not created a cluster yet. Please run ${ux.colors.reset.italic.dim(
        'ops run k8s create',
      )} to get started.`,
    )
    process.exit(1)
  }
  return { ...rest, clusters }
}

const generateClusterInfo = (cluster: ClusterDetails) =>
  `${ux.colors.reset.white(
    cluster.isPrivate ? PRIVATE_TOPOLOGY : PUBLIC_TOPOLOGY,
  )} ${ux.colors.reset.cyan(cluster.name)}.${ux.colors.reset.cyan(
    cluster.domain,
  )} ${ux.colors.dim('at')} ${ux.colors.reset.white(cluster.region)}`

const generateSelectClusterQuestions = async ({
  AWS,
  clusters,
}: Config): Promise<Config> => {
  const mappedClusters: MappedClusters[] = clusters.map(cluster => {
    const { name, domain, region, isPrivate } = cluster
    return {
      value: { name, domain, region, isPrivate },
      name: generateClusterInfo(cluster),
    }
  })

  const { clusterDetails } = (await ux.prompt(
    selectClusterQuestions(mappedClusters),
  )) as SelectClusterAnswers

  return { AWS, clusters: [clusterDetails] }
}

export const prerequisiteSetup = async (config: Config) => {
  const {
    clusters: [cluster],
  } = config

  if (!cluster.isPrivate) {
    const k8sOpsConfig = getConfigPath(cluster)
    if (fs.existsSync(k8sOpsConfig)) return config

    const missingClusterConfigError = `\n⚠️  Uh oh. k8s ops config not found for the selected cluster. Please create a new cluster to continue.`
    console.log(missingClusterConfigError)
    process.exit(1)
  }
}

const getConfigPath = (clusterDetails: ClusterDetails) => {
  const configDirectory = getConfigDir(clusterDetails)
  return path.resolve(configDirectory, 'config')
}

const defineIngress = ({
  app,
  containerPort,
  otherPaths = [],
}: IAnswers<{}>) => {
  return {
    apiVersion: apiVersions.V1_BETA_1,
    kind: kinds.INGRESS,
    metadata: {
      name: `${app}-ingress`,
      annotations: {
        'kubenetes.io/ingress.class': 'nginx',
      },
    },
    spec: {
      rules: [
        {
          http: {
            paths: [
              {
                path: `/${app}`,
                backend: {
                  serviceName: `${app}-service`,
                  servicePort: containerPort,
                },
              },
              ...otherPaths,
            ],
          },
        },
      ],
    },
  }
}

const defineService = ({
  app,
  containerPort,
  otherPorts = [],
}: IAnswers<IServicePort>) => ({
  apiVersion: apiVersions.V1,
  kind: kinds.SERVICE,
  metadata: { name: `${app}-service` },
  spec: {
    selector: { app },
    ports: [{ port: containerPort }, ...otherPorts],
    type: 'ClusterIP',
  },
})

const defineDeployment = ({
  image,
  tag,
  replicas,
  app,
  containerPort,
  otherPorts = [],
  otherContainers = [],
}: IAnswers<IContainerPort>) => {
  return {
    apiVersion: apiVersions.APP_V1,
    kind: kinds.DEPLOYMENT,
    metadata: {
      name: `${app}-deployment`,
      labels: { app },
    },
    spec: {
      replicas,
      selector: {
        matchLabels: { app },
      },
      template: {
        metadata: {
          labels: { app },
        },
        spec: {
          containers: [
            {
              name: app,
              image: tag ? [image, tag].join(':') : image,
              ports: [{ containerPort }, ...otherPorts],
            },
            ...otherContainers,
          ],
        },
      },
    },
  } as IDeployment
}

const promptResourcesQuestions = async (configs: Config) => {
  const answers: IAnswers<IContainerPort & IServicePort> = (await ux.prompt(
    resourcesQuestions,
  )) as ResourceAnswers
  return { configs, answers }
}

const writeConfigFiles = (resource: IResource, app: string) => {
  const resourceYAML = yaml.stringify(resource)
  writeToFileSync({
    dirPath: MANIFESTS_DIR,
    fileName: `${resource.metadata.name}.yaml`,
    data: resourceYAML,
  })
}

const generateConfigFiles = ({
  answers,
  configs,
}: {
  answers: IAnswers<IContainerPort & IServicePort>
  configs: Config
}) => {
  const { app, isExposed } = answers

  const service = defineService(answers)
  writeConfigFiles(service, app)

  const deployment = defineDeployment(answers)
  writeConfigFiles(deployment, app)

  if (isExposed) {
    const ingress = defineIngress(answers)
    writeConfigFiles(ingress, app)
  }

  return { answers, configs }
}

const privateDeploy = async ({
  answers: { app },
  clusterName,
}: {
  answers: IAnswers<{}>
  clusterName: string
}) => {
  const i = `-i ~/creds/cluster_rsa`
  const bastion = `admin@bastion.${clusterName}`
  const sshToBastion = `ssh ${i} ${bastion} `
  console.log(' ')

  await saveSshToKnownHosts(clusterName)
  await pExec(`scp ${i} -r ${MANIFESTS_DIR} ${bastion}:/home/admin/`)

  await pExecWithLogs(`${sshToBastion}"kubectl apply -f manifests"`)
  return sshToBastion
}

const publicDeploy = async (clusterDetails: ClusterDetails) => {
  const k8sOpsConfig = getConfigPath(clusterDetails)
  const data = fs.readFileSync(k8sOpsConfig)
  await writeToFileSync({ dirPath: KUBE_DIR, fileName: 'config', data })

  await pExec(`kubectl apply -f ${MANIFESTS_DIR}`)
  return ''
}

const checkPodStatus = ({
  answers: { app },
  deployedPods: { stdout, stderr },
}: {
  answers: IAnswers<{}>
  deployedPods: { stdout: string; stderr: string }
}) => {
  if (stderr.includes('No resources found') || !stdout) {
    console.log(
      `😰 Something went wrong with the deployment. Please double check your answers and try again!`,
      { stderr },
    )
    process.exit(1)
  }

  const pods = JSON.parse(stdout)
  const runningPod = pods.items.find(
    pod =>
      pod.metadata && pod.metadata.labels && pod.metadata.labels.app === app,
  )
  if (!runningPod) {
    console.log(
      '💩 Unable to run the pod. Please double check your answers and try again!',
    )
    process.exit(1)
  }
}

const showAppURL = async ({
  app,
  isExposed,
  deployedServices: { stdout },
}: {
  app: string
  isExposed: boolean
  deployedServices: { stdout: string }
}) => {
  if (!isExposed) {
    console.log(`\n🎉 Your app is now deployed and running on the cluster!`)
    process.exit()
  }

  const services = JSON.parse(stdout)
  if (!services) {
    console.log('No services found.')
    process.exit()
  }

  const ingressController = services.items.find(
    svc => svc.metadata && svc.metadata.name === 'nginx-ingress-controller',
  )
  if (ingressController) {
    const hostname = ingressController.status.loadBalancer.ingress[0].hostname
    console.log(
      `\n🎉 Your app is now ready! ${ux.colors.actionBlue(
        'Check it out at',
      )} ${ux.colors.italic.dim(`http://${hostname}/${app}`)}.`,
    )
  }

  console.log(
    `\nRun ${ux.colors.actionBlue(
      '`kubectl get all`',
    )} to inspect the status of your cluster's resources.`,
  )
}

const deployResources = async ({
  answers,
  configs: {
    clusters: [cluster],
  },
}: {
  answers: IAnswers<{}>
  configs: Config
}) => {
  const clusterName = `${cluster.name}.${cluster.domain}`

  const prefix = cluster.isPrivate
    ? await privateDeploy({ answers, clusterName })
    : await publicDeploy(cluster)

  console.log('\nStarting up the pods(s)...')
  await generateProgressBar(FIVE_SEC)

  await pExec(`${prefix}rm -rf manifests`)

  const deployedPods = await pExec(
    `${prefix}kubectl get pods --field-selector=status.phase=Running -o json`,
  )
  checkPodStatus({ answers, deployedPods })

  const deployedServices = await pExec(
    `${prefix}kubectl -n kube-public get svc -o json`,
  )

  await showAppURL({ ...answers, deployedServices })
}

export const generateResources = async () => {
  try {
    const generateResourcesPipeline = asyncPipe(
      clusterSetup,
      generateSelectClusterQuestions,
      sshKeyGenIfNotExists,
      prerequisiteSetup,
      promptResourcesQuestions,
      generateConfigFiles,
      deployResources,
    )
    await generateResourcesPipeline({})
  } catch (err) {
    console.log('‼️', err)
    process.exit(1)
  }
}
