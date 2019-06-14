import { ux } from '@cto.ai/sdk'
import { Question } from '@cto.ai/inquirer'
import { TOPOLOGIES, INSTALLATIONS, INSTANCE_SIZES } from '../constants'
import { validateNumber, validateInput } from '../utils'
import { NextAnswers } from '../types'

const options = ['yes', 'no']

export type InitialQuestionsAnswers = {
  topology: string
}

export const initialQuestions: Question<InitialQuestionsAnswers>[] = [
  {
    type: 'list',
    name: 'topology',
    message: `\nWhat is the topology of your cluster ${ux.colors.reset.green(
      '→',
    )}\n⚠️  ${ux.colors.secondary(
      `The 'Private' option requires a domain. Otherwise, select 'Public'.`,
    )}`,
    choices: TOPOLOGIES,
    afterMessage: `${ux.colors.reset.green('✔')} Topology`,
    afterMessageAppend: `${ux.colors.reset(' selected!')}`,
  },
]

export type NextQuestionsAnswers = {
  name: string
  domain: string
  masterNodeType: string
  nodeType: string
  masterCount: number
  nodeSize: number
}
// Set of interactive questions to gather info associated with cluster setup
export const nextQuestions: Question<NextQuestionsAnswers>[] = [
  {
    type: 'input',
    name: 'name',
    message: `\nPlease enter a name for the cluster ${ux.colors.reset.green(
      '→',
    )}\n\n🏷  ${ux.colors.white('Name')}`,
    afterMessage: `${ux.colors.reset.green('✔')} Name`,
    validate: validateInput('name'),
  },
  {
    type: 'input',
    name: 'domain',
    message: `\nPlease enter domain ${ux.colors.reset.green(
      '→',
    )}\n\n🌎  ${ux.colors.white('Domain')}`,
    afterMessage: `${ux.colors.reset.green('✔')} Domain`,
    validate: validateInput('domain'),
  },
  {
    type: 'list',
    name: 'masterNodeType',
    message: `\nPlease enter the EC2 Instance Type for the master node ${ux.colors.reset.green(
      '→',
    )}\n🔖  ${ux.colors.secondary(
      // TODO: add link to README
      `See 'EC2' in the README to learn more`,
    )}`,
    choices: INSTANCE_SIZES,
    afterMessage: `${ux.colors.reset.green('✔')} Master Node Type`,
  },
  {
    type: 'list',
    name: 'nodeType',
    message: `\nPlease enter the EC2 Instance Type for the worker node ${ux.colors.reset.green(
      '→',
    )}\n🔖  ${ux.colors.secondary(
      // TODO: add link to README
      `See 'EC2' in the README to learn more`,
    )}`,
    choices: INSTANCE_SIZES,
    afterMessage: `${ux.colors.reset.green('✔')} Worker Node Type`,
  },
  {
    type: 'number',
    name: 'masterCount',
    message: `\nPlease enter the number of master nodes ${ux.colors.reset.green(
      '→',
    )}\n${ux.colors.secondary(
      // TODO: add link to README
      `(We recommend choosing 1 or 3 nodes)\n🔖  See 'Nodes' in the README to learn more`,
    )}\n\n${ux.colors.white('Number of Master Nodes:')}`,
    afterMessage: `${ux.colors.reset.green('✔')} Master Node Count`,
    validate: validateNumber('node count'),
  },
  {
    type: 'number',
    name: 'nodeSize',
    message: `\nPlease enter the number of worker nodes ${ux.colors.reset.green(
      '→',
    )}\n${ux.colors.secondary(
      // TODO: add link to README
      `🔖  See 'Nodes' in the README to learn more`,
    )}\n\n${ux.colors.white('Number of Worker Nodes:')}`,
    afterMessage: `${ux.colors.reset.green('✔')} Worker Node Count`,
    validate: validateNumber('node count'),
  },
]

export type DnsAnswers = {
  awsHosted: boolean
}

// Set of interactive questions to gather info associated with cluster setup
export const dnsQuestions: Question<DnsAnswers>[] = [
  {
    type: 'confirm',
    name: 'awsHosted',
    message: `\nIs your original domain hosted in AWS ${ux.colors.reset.green(
      '→',
    )}\n${ux.colors.secondary(
      `🔖  See 'Route53' in the README to learn more`,
    )}\n\n`,
    afterMessage: `${ux.colors.reset.green('✔')} Confirm Route53 Hosted Zone`,
  },
]

export type GenerateNsAnswers = {
  confirm: boolean
}

export const generateNSQuestions = (
  { name, domain }: NextAnswers,
  { awsHosted }: { awsHosted: boolean },
  stdout: string,
) => {
  const digNsCommand = `${ux.colors.italic.dim(`dig ns ${name}.${domain}`)}`

  const answerSection = [
    ';; ANSWER SECTION',
    `${name}.${domain}.	21599	IN	NS	ns-2244.awsdns-13.org.`,
    `${name}.${domain}.	21599	IN	NS	ns-1092.awsdns-11.co.uk.`,
    `${name}.${domain}.	21599	IN	NS	ns-214.awsdns-33.com.`,
    `${name}.${domain}.	21599	IN	NS	ns-730.awsdns-27.net.`,
  ].join('\n')

  const digNsExample = `${ux.colors.reset(
    'The output should look similar to this:',
  )}\n\n${ux.colors.dim(answerSection)}
`
  const message = awsHosted
    ? `\nPlease confirm you can query created Name Server (NS) records for the new sub-domain by running ${digNsCommand}. ${digNsExample}`
    : `\nPlease add these Name Server (NS) records for the new sub-domain: ${stdout}\nRun ${digNsCommand}.\n${digNsExample} to confirm they have been created.`

  return [
    {
      type: 'confirm',
      name: 'confirm',
      message: `${ux.colors.reset(message)}\n`,
      afterMessage: `${ux.colors.reset.green('✔')} Confirm NS Record`,
    },
  ] as Question<GenerateNsAnswers>[]
}

export type AddonAnswers = {
  installations: string[]
}

export const addonQuestions: Question<AddonAnswers>[] = [
  {
    type: 'checkbox',
    name: 'installations',
    choices: INSTALLATIONS,
    default: [],
    message: `\nSelect the add-ons you would like to install (optional) ${ux.colors.reset.green(
      '→',
    )}\n`,
  },
]
