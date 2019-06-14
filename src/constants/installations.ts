export const DASHBOARD = 'dashboard'
export const PROMETHEUS = 'monitoring'
export const EFK = 'elastic-stack'

export const INSTALLATIONS = [
  {
    name: 'Kubernetes Dashboard (Inspect the status of the cluster)',
    value: DASHBOARD,
    short: DASHBOARD,
  },
  {
    name: 'Prometheus Monitoring System',
    value: PROMETHEUS,
    short: 'Prometheus',
  },
  {
    name: 'Elastic Search, Fluentd, and Kibana (EFK)',
    value: EFK,
    short: 'EFK',
  },
]
