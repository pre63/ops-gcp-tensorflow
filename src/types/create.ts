import { initPlaybook } from '../commands/create'
import { Config } from './config'

export type CreatePipeline = {
  playbook: Playbook
  initAnswers: InitAnswers
  nextAnswers: NextAnswers
  addonAnswers: AddonAnswers
  configs: Config
}

export type Playbook = typeof initPlaybook

export type InitAnswers = {
  topology: string
}

export type AddonAnswers = {
  installations: string[]
}

export type NextAnswers = {
  accessKeyId: string
  accessKeySecret: string
  domain: string
  name: string
  masterNodeType: string
  nodeType: string
  nodeSize: string
  masterCount: string
}

export type MappedClusters = {
  value: { name: string; domain: string; isPrivate: boolean }
  name: string
}
