import { ux } from '@cto.ai/sdk'
import { AWS_REGIONS, TOPOLOGIES, DEFAULT_PUBLIC_DOMAIN } from '../constants'
import { Question } from '@cto.ai/inquirer'

export type ClusterAnswers = {
  name: string
  topology: string
  domain: string
  region: string
  confirm: boolean
}

export const clusterQuestions: Question<ClusterAnswers>[] = [
  {
    type: 'input',
    name: 'name',
    message: `\nType the name of the cluster you want to delete`,
    validate: (input: string) =>
      !!input || 'Please enter a cluster name to delete',
  },
  {
    type: 'list',
    name: 'topology',
    message: `\nWhat is the topology of your cluster (for private topology you need to have a domain)? ${ux.colors.reset.green(
      '→',
    )}`,
    choices: TOPOLOGIES,
    afterMessage: `${ux.colors.reset.green('✔')} Topology`,
    afterMessageAppend: `${ux.colors.reset(' selected!')}`,
  },
  {
    type: 'list',
    name: 'region',
    message: `\nSelect AWS default region ${ux.colors.reset.green('→')}`,
    choices: AWS_REGIONS,
    afterMessage: `${ux.colors.reset.green('✔')} Region`,
  },
  {
    type: 'input',
    name: 'domain',
    message: `\nType the domain of the cluster you want to delete ${ux.colors.reset(
      ux.colors.dim(`(${DEFAULT_PUBLIC_DOMAIN})`),
    )}`,
  },
  {
    type: 'confirm',
    name: 'confirm',
    message: `\nAre you sure you want to delete the cluster?`,
  },
]
