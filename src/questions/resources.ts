import { ux } from '@cto.ai/sdk'
import { Question } from '@cto.ai/inquirer'
import { MappedClusters, ClusterDetails } from '../types'

export type ResourceAnswers = {
  app: string
  image: string
  tag: string
  replicas: number
  containerPort: number
  isExposed: boolean
}

const isExposedWarning = () =>
  ux.colors.tertiary(
    `It will be accessible from ${ux.colors.bold(
      'outside',
    )} the kubernetes cluster.`,
  )

export const resourcesQuestions: Question<ResourceAnswers>[] = [
  {
    type: 'input',
    name: 'app',
    message: `\nWhat would you like to name the application?\n${ux.colors.tertiary(
      `If exposed, this should correspond to the app's main endpoint`,
    )}\n\nApplication name`,
    afterMessage: `${ux.colors.reset.green('✔')} App Name`,
    validate: (input: string) =>
      !!input.trim() || 'Please provide a valid app name',
  },
  {
    type: 'input',
    name: 'image',
    message: `\nEnter a name/URL for the image ${ux.colors.reset.green(
      '→',
    )}\n${ux.colors.tertiary(
      'e.g. jwilder/whoami, registry.hub.docker.com/library/busybox',
    )}\n\nImage name/URL`,
    afterMessage: `${ux.colors.reset.green('✔')} Image Name`,
    validate: (input: string) =>
      !!input.trim() || 'Please enter a valid image name/URL',
  },
  {
    type: 'input',
    name: 'tag',
    message: `\nGive the image a tag, e.g. v1.0.0 ${ux.colors.reset.green(
      '→',
    )}\n${ux.colors.tertiary(
      "If no tag is given, 'latest' will be assigned",
    )}\n\nTag name`,
    afterMessage: `${ux.colors.reset.green('✔')} Image Tag`,
    validate: (input: string) =>
      !!input.trim() || 'Please enter a valid image tag',
    default: 'latest',
  },
  {
    type: 'number',
    name: 'replicas',
    message: `\nChoose the number of instances ${ux.colors.reset.green(
      '→',
    )}\n${ux.colors.tertiary(
      "If no number is given, '1' instance will be set",
    )}\n\nNumber of instances`,
    afterMessage: `${ux.colors.reset.green('✔')} Number of Replicas`,
    validate: (input: number) => !!input || 'Please enter a valid number',
    default: 1,
  },
  {
    type: 'number',
    name: 'containerPort',
    message: `\nEnter the container's port ${ux.colors.reset.green(
      '→',
    )}\n${ux.colors.tertiary(
      "e.g. Check the Dockerfile 'EXPOSE' value",
    )}\n\nPort number`,
    afterMessage: `${ux.colors.reset.green('✔')} Container Port`,
    validate: (input: number) => !!input || 'Please enter a valid number',
  },
  {
    type: 'confirm',
    name: 'isExposed',
    message: `\n🌎 Do you want this application to be publicly accessible? ${ux.colors.reset.green(
      '→',
    )}\n${isExposedWarning()}\n\n`,
    afterMessage: `${ux.colors.reset.green('✔')} Use Ingress`,
  },
]

export type SelectClusterAnswers = {
  clusterDetails: ClusterDetails
}

export const selectClusterQuestions = (mappedClusters: MappedClusters[]) =>
  [
    {
      type: 'list',
      name: 'clusterDetails',
      message: `\nPlease choose the cluster you would like to generate resources for`,
      choices: mappedClusters,
      afterMessage: `${ux.colors.reset.green('✔')} Cluster`,
    },
  ] as Question<SelectClusterAnswers>[]
