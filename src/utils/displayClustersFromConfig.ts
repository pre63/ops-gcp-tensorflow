import { ux } from '@cto.ai/sdk'
import { Config, ClusterDetails } from '../types'
import { PRIVATE_TOPOLOGY, PUBLIC_TOPOLOGY } from '../constants'

const generateClusterInfo = (cluster: ClusterDetails) =>
  `${ux.colors.reset.white(
    cluster.isPrivate ? PRIVATE_TOPOLOGY : PUBLIC_TOPOLOGY,
  )} ${ux.colors.reset.cyan(cluster.name)}.${ux.colors.reset.cyan(
    cluster.domain,
  )} ${ux.colors.dim('at')} ${ux.colors.reset.white(cluster.region)}`

export const displayClustersFromConfig = ({
  clusters,
}: Config): {
  value: ClusterDetails
  name: string
}[] => {
  return clusters.map(cluster => {
    return {
      value: cluster,
      name: generateClusterInfo(cluster),
    }
  })
}
