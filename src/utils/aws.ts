import { ux } from '@cto.ai/sdk'
import { readConfig, writeConfig } from './config'
import { getFlags } from './getFlags'
import { Config, AWSConfig } from '../types/index'
import { writeToFileSync } from '.'
import { AWS_DIR } from '../constants'
import {
  reSignInQuestion,
  reSignInAnswers,
  awsQuestions,
} from '../questions/aws'

export const writeCredentials = async (
  accessKeyId: string,
  accessKeySecret: string,
  awsDir: string,
) => {
  const awsCredentials = `[default]\naws_access_key_id = ${accessKeyId}\naws_secret_access_key = ${accessKeySecret}\n`
  writeToFileSync({
    dirPath: awsDir,
    fileName: 'credentials',
    data: awsCredentials,
  })
}

export const writeRegion = async (region: string, awsDir: string) => {
  const awsConfigs = `[default]\nregion = ${region}\n`
  writeToFileSync({
    dirPath: awsDir,
    fileName: 'config',
    data: awsConfigs,
  })
}

/**
 * Takes in a Config object and the desired directory to write the
 * credentials and config file to
 */
export const configureAws = async ({ AWS }: Config, awsDir: string) => {
  const { accessKeyId, accessKeySecret, region } = AWS

  await writeRegion(region, awsDir)
  await writeCredentials(accessKeyId, accessKeySecret, awsDir)
}

export const awsSetup = async () => {
  let configs: Config = await readConfig()

  const flags = getFlags()
  const hasSignInFlag = flags.includes('-s') || flags.includes('--signin')

  const { useSavedConfig } = (await ux.prompt(
    reSignInQuestion,
  )) as reSignInAnswers

  if (
    useSavedConfig &&
    !hasSignInFlag &&
    configs &&
    configs.AWS &&
    configs.AWS.region &&
    configs.AWS.accessKeyId &&
    configs.AWS.accessKeySecret
  ) {
    await configureAws(configs, AWS_DIR)
    return configs.AWS
  }

  const config = (await ux.prompt(awsQuestions)) as AWSConfig
  configs = await writeConfig({ AWS: config })

  await configureAws(configs, AWS_DIR)

  return configs.AWS
}
