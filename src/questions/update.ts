import { Question } from '@cto.ai/inquirer'
import { KUBERNETES_VERSION, INSTANCE_SIZES } from '../constants'
import { ux } from '@cto.ai/sdk'

export type ConfirmUpgradeKubernetesVersionAnswers = {
  shouldChangeKubernetesVersion: boolean
}

export const confirmUpgradeKubernetesVersionQuestion: Question<
  ConfirmUpgradeKubernetesVersionAnswers
>[] = [
  {
    type: 'confirm',
    name: 'shouldChangeKubernetesVersion',
    message: `\nDo you want to upgrade the Kubernetes version?`,
  },
]

export type UpgradeKubernetesVersionAnswers = {
  kubernetesVersion: string
}

export const upgradeKubernetesVersionQuestion: Question<
  UpgradeKubernetesVersionAnswers
>[] = [
  {
    type: 'input',
    name: 'kubernetesVersion',
    message: `\nPlease enter the desired kubernetes version you'd like to upgrade to. ${ux.colors.dim(
      'e.g. ' + KUBERNETES_VERSION,
    )}`,
    validate: (input: string) =>
      !!input || 'Please enter a valid kubernetes version',
    afterMessage: `${ux.colors.reset.green('✔')} Kubernetes`,
    afterMessageAppend: `${ux.colors.reset(' selected!')}`,
  },
]

export type ConfirmChangeWorkerNodeCountAnswers = {
  shouldChangeWorkerNodeCount: boolean
}

export const confirmChangeWorkerNodeCountQuestion: Question<
  ConfirmChangeWorkerNodeCountAnswers
>[] = [
  {
    type: 'confirm',
    name: 'shouldChangeWorkerNodeCount',
    message: `\nDo you want to change the number of worker nodes?`,
  },
]

export type ChangeWorkerNodeCountAnswers = {
  numWorkerNodes: string
}

export const changeWorkerNodeCountQuestion: Question<
  ChangeWorkerNodeCountAnswers
>[] = [
  {
    type: 'number',
    name: 'numWorkerNodes',
    message: `Please enter the desired number of worker nodes`,
    validate: (input: number) => !!input || 'Please enter a valid number',
    afterMessage: `${ux.colors.reset.green('✔')} Worker nodes changed to be`,
  },
]

export type ConfirmChangeInstanceSizeAnswers = {
  shouldChangeInstanceSize: boolean
}

export const confirmChangeInstanceSizeQuestion: Question<
  ConfirmChangeInstanceSizeAnswers
>[] = [
  {
    type: 'confirm',
    name: 'shouldChangeInstanceSize',
    message: `\nDo you want to change the instance size of the nodes?`,
  },
]

export type ChangeInstanceSizeAnswers = {
  nodeInstanceSize: string
}

export const changeInstanceSizeQuestion: Question<
  ChangeInstanceSizeAnswers
>[] = [
  {
    type: 'list',
    name: 'nodeInstanceSize',
    message: `Please enter the desired instance size`,
    choices: INSTANCE_SIZES,
    afterMessage: `${ux.colors.reset.green('✔')} Instance size changed to be`,
  },
]
