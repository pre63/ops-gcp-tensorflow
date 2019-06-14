import { Question } from '@cto.ai/inquirer'
import { ux } from '@cto.ai/sdk'
import { ClusterDetails } from '../types'

export type ClusterDetailsAnswers = {
  clusterDetails: ClusterDetails
}

export const clusterDetailsQuestions = (
  mappedClusters: { value: ClusterDetails; name: string }[],
): Question<ClusterDetailsAnswers>[] => [
  {
    type: 'list',
    name: 'clusterDetails',
    message: `\nWhich cluster would you like to delete?`,
    choices: mappedClusters,
    afterMessage: `${ux.colors.reset.green('✔')} Cluster`,
    afterMessageAppend: `${ux.colors.reset(' selected!')}`,
  },
]

export type ValidationPromptAnswers = {
  confirm: string
}

export const validationPromptQuestions = (
  clusterDetails: ClusterDetails,
): Question<ValidationPromptAnswers>[] => [
  {
    type: 'input',
    name: 'confirm',
    message: `\nPlease type the cluster name and host to confirm. ${ux.colors.dim(
      '(e.g. test-cluster.k8s.local)',
    )}`,
    validate: (input: string) =>
      input === `${clusterDetails.name}.${clusterDetails.domain}` ||
      'Cluster name and domain does not match',
  },
]
