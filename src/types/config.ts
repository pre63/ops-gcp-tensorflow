export type AWSConfig = {
  accessKeyId: string
  accessKeySecret: string
  region: string
}

export type ClusterDetails = {
  name: string
  domain: string
  region: string
  isPrivate: boolean
}

export type Config = {
  AWS: AWSConfig
  clusters: ClusterDetails[]
}
