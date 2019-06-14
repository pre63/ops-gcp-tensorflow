const regionCodes = {
  'us-east-1': 'US East (N. Virginia)',
  'us-east-2': 'US East (Ohio)',
  'us-west-1': 'US West (N. California)',
  'us-west-2': 'US West (Oregon)',
  'ca-central-1': 'Canada (Central)',
}

const TOTAL_LENGTH = 18

export const AWS_REGIONS = Object.entries(regionCodes).map(
  ([code, longName]: [string, string]) => {
    const nSpaces = Array.from({ length: TOTAL_LENGTH - code.length }).join(' ')
    return {
      name: `${code}${nSpaces}${longName}`,
      value: code,
      short: code,
    }
  },
)

export const INSTANCE_SIZES = ['t2.medium', 't2.large', 'm5.large', 'm5.xlarge']

export const DEFAULT_PUBLIC_DOMAIN = 'k8s.local'
