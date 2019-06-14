import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'
import * as childProcess from 'child_process'
import { ux } from '@cto.ai/sdk'
import { writeToFileSync } from './writeToFileSync'
import { CREDS_DIR } from '../constants'

const pExec = util.promisify(childProcess.exec)

const hasCredsDir = fs.existsSync(CREDS_DIR)
const filePath = path.resolve(CREDS_DIR, 'cluster_rsa')
const hasCredsFile = fs.existsSync(filePath)

export const saveSshToKnownHosts = async (clusterName: string) => {
  const { stdout } = await pExec(`ssh-keyscan -H bastion.${clusterName}`)
  writeToFileSync({
    dirPath: `${process.env.HOME}/.ssh/`,
    fileName: 'known_hosts',
    data: stdout,
  })
}

export const clusterRSAExists =
  hasCredsDir && hasCredsFile && !!fs.readFileSync(filePath, 'utf8')

export const sshKeyGenIfNotExists = async (args: any) => {
  if (clusterRSAExists) return args

  fs.mkdirSync(CREDS_DIR, { recursive: true })
  const { stdout } = await pExec(
    `ssh-keygen -b 4096 -t rsa -C "cluster_rsa" -N "" -f ${filePath}`,
  )

  if (stdout)
    console.log(
      `\n👍 A new SSH key pair has been generated in the 'creds' filder of your home directory:\n${ux.colors.reset.dim(
        '(public key)',
      )} ${ux.colors.bold('~/creds/cluster_rsa.pub')}\n${ux.colors.reset.dim(
        '(private key)',
      )} ${ux.colors.bold('~/creds/cluster_rsa')}\n`,
    )
  return args
}
