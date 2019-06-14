import { Config, ClusterDetails } from './config'

export type UpdatePipeline = {
  sshScript: string
  answers: UpdateAnswers
  configs: Config
  clusterDetails: ClusterDetails
}

export type UpdateAnswers = {
  numWorkerNodes: string
  kubernetesVersion: string
  nodeInstanceSize: string
}
