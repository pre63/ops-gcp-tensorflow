import { ux } from '@cto.ai/sdk'

// import * as util from 'util'
// import * as fs from 'fs-extra'
// import * as childProcess from 'child_process'
// import * as yaml from 'yaml'
// import { awsSetup } from '../utils/aws'
// import {
//   asyncPipe,
//   writeToFileSync,
//   getAzWithMax,
//   generateProgressBar,
//   sshKeyGenIfNotExists,
//   saveSshToKnownHosts,
// } from '../utils'
// import {
//   CreatePipeline,
//   InitAnswers,
//   ClusterDetails,
//   Config,
//   NextAnswers,
//   AddonAnswers,
// } from '../types/index'
// import { readConfig, writeConfig } from '../utils/config'
// import {
//   ANSIBLE_DIR,
//   PRIVATE_TOPOLOGY,
//   OPS_DIR,
//   KUBERNETES_VERSION,
//   DEFAULT_PUBLIC_DOMAIN,
//   PROMETHEUS,
//   EFK,
//   PUBLIC_TOPOLOGY,
// } from '../constants'
// import {
//   initialQuestions,
//   dnsQuestions,
//   nextQuestions,
//   generateNSQuestions,
//   addonQuestions,
//   DnsAnswers,
//   GenerateNsAnswers,
// } from '../questions'
// import { writeConfigAndDestroyCluster, getConfigDir } from './destroy'

// const pExec = util.promisify(childProcess.exec)

// const TIMEOUT_INTERVAL = 5000
// const TIMEOUT_PRIVATE_TOPOLOGY = 3e5
// const TIMEOUT_DNS = 3e4

// export const showPrerunMessage = () => {
//   const lines = [
//     `\n⏱  Requires ~15 minutes`,
//     `⚠️  This Op may incur some cost. Please run ${ux.colors.italic.dim(
//       'ops run k8s destroy',
//     )} when finished.`,
//     `\nHere's what you'll need to complete this Op:`,
//     `\n✅ AWS Access Key ID`,
//     `✅ AWS Secret Access Key`,
//     `✅ ssh public and private key pair`,
//     `✅ kubectl must be installed: https://kubernetes.io/docs/tasks/tools/install-kubectl`,
//     // TODO: Add link to the README
//     `\nFor more info please view the README.`,
//     `\nLet's get started.\n`,
//   ]
//   console.log(lines.join(`\n`))
// }

// export const initPlaybook = {
//   hosts: 'kubernetes-cluster',
// }

// const promptInitialQuestions = async (_: {}) =>
//   ux.prompt(initialQuestions) as Promise<InitAnswers>

// const publicConfigQuestions = async () => {
//   const questions = nextQuestions.filter(q => q.name !== 'domain')
//   const nextAnswers = await ux.prompt(questions)
//   return { ...nextAnswers, domain: DEFAULT_PUBLIC_DOMAIN } as NextAnswers
// }

// const privateConfigQuestions = async () =>
//   ux.prompt(nextQuestions) as Promise<NextAnswers>

// const promptNextQuestions = async (initAnswers: InitAnswers) => {
//   const nextAnswers =
//     initAnswers.topology === PUBLIC_TOPOLOGY
//       ? await publicConfigQuestions()
//       : await privateConfigQuestions()
//   return { initAnswers, nextAnswers }
// }

// const writeClusterConfig = async ({
//   nextAnswers,
//   configs,
//   ...rest
// }: CreatePipeline) => {
//   const {
//     name,
//     domain,
//     nodeSize,
//     masterNodeType,
//     nodeType,
//     masterCount,
//   } = nextAnswers
//   const { region } = configs.AWS

//   const clusterConfig = `
// #Required Variables
// CLUSTER_NAME=${name}
// DOMAIN=${domain}
// MASTER_COUNT=${masterCount}
// NODE_COUNT=${nodeSize}
// MASTER_SIZE=${masterNodeType}
// NODE_SIZE=${nodeType}
// NETWORK_CIDR=172.20.0.0/16
// KUBERNETES_VERSION=${KUBERNETES_VERSION}

// AWS_DEFAULT_REGION=${region}
// AVAILABILITY_ZONES=${getAzWithMax(region, parseInt(masterCount, 10))}

// KOPS_STATE_STORE=s3://${name}.${domain}
// KOPS_BIN=/usr/local/bin/kops
// KUBECTL_BIN=/usr/local/bin/kubectl
// SSH_KEY=/root/creds/cluster_rsa.pub

// #Options
// CREATE_S3_BUCKET=true
// CREATE_KOPS_CLUSTER=true
//   `

//   writeToFileSync({
//     dirPath: OPS_DIR,
//     fileName: 'cluster-setup.cfg',
//     data: clusterConfig,
//   })
//   return { ...rest, configs, nextAnswers }
// }

// const createSubdomainNSRecord = (
//   { name, domain }: NextAnswers,
//   nsRecords: string[],
// ) => ({
//   Comment: 'Create a subdomain NS record in the parent domain',
//   Changes: [
//     {
//       Action: 'CREATE',
//       ResourceRecordSet: {
//         Name: `${name}.${domain}`,
//         Type: 'NS',
//         TTL: 300,
//         ResourceRecords: nsRecords.map((record: string) => ({
//           Value: record,
//         })),
//       },
//     },
//   ],
// })

// const handleSetupDNSError = (stderr: string) => {
//   console.error(
//     `💩 Oops, something went wrong with the DNS setup. Please double check your Route53 and try again!`,
//     stderr,
//   )
//   throw new Error('Error setting up DNS!')
// }

// const applySubdomainToParentHostedZone = async ({ domain }: NextAnswers) => {
//   const command = `PARENT_ZONE_ID=$(aws route53 list-hosted-zones | jq '.HostedZones[] | select(.Name=="${domain}.") | .Id') && PARENT_ZONE_ID="\${PARENT_ZONE_ID%\\"}" && PARENT_ZONE_ID="\${PARENT_ZONE_ID#\\"}" && aws route53 change-resource-record-sets --hosted-zone-id $PARENT_ZONE_ID --change-batch file://subdomain.json`
//   const { stderr } = await pExec(command)
//   await new Promise(resolve => setTimeout(resolve, TIMEOUT_DNS))

//   if (stderr) handleSetupDNSError(stderr)
// }

// const handleSetupDNSOk = async ({
//   nextAnswers,
//   stdout,
// }: {
//   nextAnswers: NextAnswers
//   stdout: string
// }) => {
//   const nsRecords = JSON.parse(stdout)
//   const dnsAnswers = (await ux.prompt(dnsQuestions)) as DnsAnswers

//   if (dnsAnswers.awsHosted) {
//     console.log('')
//     ux.spinner.start('Creating NS record in the domain')

//     const subdomain = createSubdomainNSRecord(nextAnswers, nsRecords)
//     writeToFileSync({
//       dirPath: OPS_DIR,
//       fileName: 'subdomain.json',
//       data: JSON.stringify(subdomain, null, 2),
//     })
//     await applySubdomainToParentHostedZone(nextAnswers)

//     ux.spinner.stop(ux.colors.green('done!'))
//   }

//   const { confirm } = (await ux.prompt(
//     generateNSQuestions(nextAnswers, dnsAnswers, stdout),
//   )) as GenerateNsAnswers

//   if (!confirm) process.exit()
// }

// const getConfigs = async (createPipelineArgs: CreatePipeline) => {
//   const configs: Config = await readConfig()
//   return { ...createPipelineArgs, configs }
// }

// const setupDNS = async ({
//   initAnswers,
//   nextAnswers,
//   ...rest
// }: CreatePipeline) => {
//   // If topology is public, skip DNS setup
//   if (initAnswers.topology !== PRIVATE_TOPOLOGY)
//     return { ...rest, initAnswers, nextAnswers }

//   console.log('')
//   ux.spinner.start('Creating hosted zone on Route53')

//   const { name, domain } = nextAnswers
//   const command = `ID=$(uuidgen) && aws route53 create-hosted-zone --name ${name}.${domain} --caller-reference $ID | jq .DelegationSet.NameServers`

//   const { stdout, stderr } = await pExec(command)

//   ux.spinner.stop(ux.colors.green('done!'))

//   if (stderr) handleSetupDNSError(stderr)
//   if (stdout) await handleSetupDNSOk({ nextAnswers, stdout })

//   return { ...rest, initAnswers, nextAnswers }
// }

// const createKopsCluster = async (
//   { name, domain }: NextAnswers,
//   { topology }: InitAnswers,
//   { AWS: { region } }: Config,
// ) => {
//   try {
//     await pExec('mv src/cluster-formation/* .')
//     await pExec(`bash cluster-setup-${topology}.sh`)
//   } catch (err) {
//     console.error('‼️', err)
//     writeConfigAndDestroyCluster({
//       name,
//       topology,
//       domain,
//       confirm: true,
//       region,
//     })
//   }
// }

// const validateCluster = async ({ topology }: InitAnswers) => {
//   if (topology === PRIVATE_TOPOLOGY) {
//     console.log('\nValidating cluster...')
//     await generateProgressBar(TIMEOUT_PRIVATE_TOPOLOGY)
//     return
//   }

//   ux.spinner.start('Validating cluster')
//   let isClusterValidated = false
//   while (!isClusterValidated) {
//     await new Promise(resolve => setTimeout(resolve, TIMEOUT_INTERVAL))
//     try {
//       // The `kops validate cluster` command throws an error if the
//       // cluster isn't validated yet, by a custom non-zero exit code.
//       const command = 'bash cluster-validate.sh'
//       await pExec(command)
//       isClusterValidated = true
//     } catch (err) {}
//   }
//   ux.spinner.stop(ux.colors.green('done!\n'))
// }

// const applyClusterConfigs = async ({
//   nextAnswers,
//   initAnswers,
//   configs,
//   ...rest
// }: CreatePipeline) => {
//   console.log('')
//   ux.spinner.start('Creating kubernetes cluster on AWS')

//   await createKopsCluster(nextAnswers, initAnswers, configs)

//   ux.spinner.stop(ux.colors.green('done!'))

//   // TODO: Destroy the cluster on fallback
//   await validateCluster(initAnswers)

//   return { ...rest, configs, initAnswers, nextAnswers }
// }

// export const promptAddonQuestions = async (
//   createPipelineArgs: CreatePipeline,
// ) => {
//   const addonAnswers: AddonAnswers = await ux.prompt(addonQuestions)
//   return { ...createPipelineArgs, addonAnswers }
// }

// const buildRemoteAgent = ({ topology }: InitAnswers) => {
//   return topology === PRIVATE_TOPOLOGY
//     ? { remote_user: 'admin', become: 'yes', become_user: 'root' }
//     : {}
// }

// const buildPlaybookVars = ({ topology }: InitAnswers) => {
//   return [
//     { private_topology: topology === PRIVATE_TOPOLOGY },
//     { aws_region: `"{{ region }}"` },
//     { cluster_name: `"{{ clusterName }}"` },
//     { cluster_domain: `"{{ clusterDomain }}"` },
//   ]
// }

// const buildPlaybookRoles = ({
//   topology,
//   installations,
// }: InitAnswers & AddonAnswers) => {
//   const privateRoles =
//     topology === PRIVATE_TOPOLOGY ? ['welcome-text', 'kubectl', 'kops'] : []
//   return [...privateRoles, 'helm', 'nginx-ingress', ...(installations || [])]
// }

// const writePlaybook = ({
//   initAnswers,
//   nextAnswers,
//   addonAnswers,
//   ...rest
// }: CreatePipeline) => {
//   const playbookVars = { ...initAnswers, ...addonAnswers }
//   const playbook = [
//     {
//       ...initPlaybook,
//       ...buildRemoteAgent(playbookVars),
//       roles: buildPlaybookRoles(playbookVars),
//       vars: buildPlaybookVars(playbookVars),
//     },
//   ]
//   const playbookYAML = yaml.stringify(playbook)

//   writeToFileSync({
//     dirPath: OPS_DIR,
//     fileName: 'playbook-cluster-formation.yml',
//     data: playbookYAML,
//   })
//   return { ...rest, playbook, initAnswers, nextAnswers, addonAnswers }
// }

// const setupClusterHost = async ({
//   initAnswers,
//   nextAnswers,
//   ...rest
// }: CreatePipeline) => {
//   const { name, domain } = nextAnswers
//   const { topology } = initAnswers
//   const clusterName = `${name}.${domain}`

//   const clusterHost =
//     topology === PRIVATE_TOPOLOGY
//       ? `[kubernetes-cluster]\nbastion.${clusterName}\n`
//       : '[kubernetes-cluster]\nlocalhost  ansible_connection=local'

//   writeToFileSync({
//     dirPath: ANSIBLE_DIR,
//     fileName: 'hosts',
//     data: clusterHost,
//   })

//   if (topology === PRIVATE_TOPOLOGY) await saveSshToKnownHosts(clusterName)
//   return { ...rest, initAnswers, nextAnswers }
// }

// const runAnsiblePlaybook = async ({
//   initAnswers,
//   nextAnswers,
//   addonAnswers,
//   configs,
//   ...rest
// }: CreatePipeline) => {
//   const { name, domain, masterCount } = nextAnswers
//   const { region } = configs.AWS
//   const privateKey =
//     initAnswers.topology === PRIVATE_TOPOLOGY
//       ? '--private-key /root/creds/cluster_rsa'
//       : ''

//   console.log('')
//   ux.spinner.start('👷‍ Installing the necessary packages on the cluster')

//   const regions = getAzWithMax(region, parseInt(masterCount, 10))

//   const playbook = `ansible-playbook playbook-cluster-formation.yml ${privateKey} --extra-vars "region=${regions} clusterName=${name} clusterDomain=${domain}"`

//   const { stderr } = await pExec(playbook).catch(err => {
//     console.log(err)
//     throw new Error('Failed installing packages on the cluster!')
//   })
//   if (stderr) console.error('stderr :', stderr)

//   ux.spinner.stop(ux.colors.green('done!'))
//   return { ...rest, configs, initAnswers, nextAnswers, addonAnswers }
// }

// const showDashboardURL = async ({
//   addonAnswers: { installations },
//   configDirectory,
// }: {
//   addonAnswers: AddonAnswers
//   configDirectory: string
// }) => {
//   await fs.mkdirp(configDirectory)
//   await fs.copy('/root/.kube/config', `${configDirectory}/config`)

//   if (installations.includes(EFK)) {
//     const { stdout } = await pExec(
//       `kubectl -n kube-public get svc -o json | jq \'.items[] | select(.metadata.name=="nginx-ingress-controller") | .status.loadBalancer.ingress[0].hostname\'`,
//     )
//     console.log(`🏁 You can access Kibana dashboard using this link: ${stdout}`)
//   }

//   if (installations.includes(PROMETHEUS)) {
//     const { stdout } = await pExec(
//       `kubectl -n monitoring get svc -o json | jq \'.items[] | select(.metadata.name=="grafana") | .status.loadBalancer.ingress[0].hostname\'`,
//     )
//     console.log(
//       `\n🏁 Access the Grafana dashboard using this link: ${stdout} \nUsername: admin \nPassword: Grafana1234`,
//     )
//   }

//   // TODO: Improve this message
//   console.log(
//     `\n🏁 To access your cluster, you can use the saved config file (i.e. ${configDirectory}/config) with installed kubectl on your machine`,
//   )
// }

// const validateInstallations = async ({
//   initAnswers: { topology },
//   nextAnswers: { name, domain },
//   addonAnswers,
//   configs: {
//     AWS: { region },
//   },
// }: {
//   initAnswers: InitAnswers
//   nextAnswers: NextAnswers
//   addonAnswers: AddonAnswers
//   configs: Config
// }) => {
//   console.log('\nValidating the installed packages...')
//   await generateProgressBar(TIMEOUT_PRIVATE_TOPOLOGY)

//   console.log(`\n🎉 Great! Your cluster is now ready.`)

//   const configDirectory = getConfigDir({ name, domain, region })

//   if (topology === PUBLIC_TOPOLOGY)
//     await showDashboardURL({ addonAnswers, configDirectory })
//   if (topology === PRIVATE_TOPOLOGY) {
//     console.log(
//       `\nYou may connect to the cluster by running ${ux.colors.italic.dim(
//         `ssh -i ~/creds/cluster_rsa admin@bastion.${name}.${domain}`,
//       )}.`,
//     )
//   }

//   console.log(
//     `\n☝️  Run ${ux.colors.italic.dim(
//       'ops run k8s destroy',
//     )} if you’re not using this cluster for production or you will incur unwanted costs! 💩💰`,
//   )
// }

// const saveClusterDetails = async ({
//   configs,
//   nextAnswers,
//   initAnswers,
//   ...rest
// }: CreatePipeline) => {
//   let { clusters } = configs
//   const { name, domain } = nextAnswers
//   const { region } = configs.AWS
//   const { topology } = initAnswers
//   const clusterDetails: ClusterDetails = {
//     name,
//     domain,
//     region,
//     isPrivate: topology === PRIVATE_TOPOLOGY,
//   }

//   if (clusters && clusters.length) {
//     clusters.push(clusterDetails)
//   } else {
//     clusters = [clusterDetails]
//   }

//   await writeConfig({ clusters })

//   return { ...rest, configs, initAnswers, nextAnswers }
// }

export const train = async (file) => {

  console.log('TRAINING:', file)

  // try {
  //   const createPipeline = asyncPipe(
  //     showPrerunMessage,
  //     awsSetup,
  //     sshKeyGenIfNotExists,
  //     promptInitialQuestions,
  //     promptNextQuestions,
  //     getConfigs,
  //     saveClusterDetails,
  //     writeClusterConfig,
  //     setupDNS,
  //     applyClusterConfigs,
  //     promptAddonQuestions,
  //     writePlaybook,
  //     setupClusterHost,
  //     runAnsiblePlaybook,
  //     validateInstallations,
  //   )

  //   await createPipeline({})
  //   process.exit()
  // } catch (err) {
    // console.log(err)
    // console.error(
    //   `\n‼️ Please run ${ux.colors.italic.dim(
    //     'ops run k8s destroy',
    //   )} to completely delete all resources`,
    // )
    // process.exit(1)
  // }
}
