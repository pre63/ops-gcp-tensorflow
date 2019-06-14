import * as fsExtra from 'fs-extra'
import * as path from 'path'
import { CONFIG_DIR } from '../constants'
import { AWSConfig, Config } from '../types'

const { outputJson, readJson } = fsExtra

export const writeConfig = async (newConfigObj: Partial<Config>) => {
  const oldConfigObj = await readConfig()
  const mergedConfigObj = {
    ...oldConfigObj,
    ...newConfigObj,
  }

  if (!mergedConfigObj.clusters || !mergedConfigObj.clusters.length)
    mergedConfigObj.clusters = []

  if (!mergedConfigObj.AWS) mergedConfigObj.AWS = {}

  await outputJson(path.join(CONFIG_DIR, 'config.json'), mergedConfigObj)
  return mergedConfigObj
}

export const readConfig = async () => {
  return readJson(path.join(CONFIG_DIR, 'config.json')).catch(() => {
    return {}
  })
}
