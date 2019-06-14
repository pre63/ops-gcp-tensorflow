import { Config } from './config'

export type DestroyPipeline = {
  answers: DestroyAnswers
  configs: Config
}

export type DestroyAnswers = {
  name: string
  topology: string
  domain: string
  confirm: boolean
  region: string
}

/**
 * There could potentially be other fields returned from AWS,
 * but these are the only ones we need.
 * Complete documentation can be found here:
 * https://docs.aws.amazon.com/cli/latest/reference/route53/list-hosted-zones.html
 */
export type AwsHostedZones = {
  HostedZones: {
    Name: string
    Id: string
  }[]
}

export type AwsResourceRecordSet = {
  ResourceRecord: {
    Value: string
  }[]
  Type: string
  Name: string
  TTL: string
}

export type AwsResourceRecordSets = {
  ResourceRecordSets: AwsResourceRecordSet[]
}

export type AwsNsRecordChange = {
  Action: string
  ResourceRecordSet: AwsResourceRecordSet
  Type: string
  Name: string
  TTL: number
}
