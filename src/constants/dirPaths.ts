import * as path from 'path'

export const OPS_DIR = '/ops'
export const TMP_DIR = '/tmp'
export const ROOT_DIR = '/root'

export const ANSIBLE_DIR = '/etc/ansible'
export const CONFIG_DIR = '/root/k8s-ops'
export const MANIFESTS_DIR = path.resolve(TMP_DIR, 'manifests')
export const KUBE_DIR = path.resolve(ROOT_DIR, '.kube')
export const CREDS_DIR = path.resolve(ROOT_DIR, 'creds')
// TODO: use sdk.homeDir()
export const AWS_DIR = path.resolve(process.env.HOME || '', '.aws')
