/**
 * Gets the availability zones in North America.
 * Could potentially be improved to support worldwide AZ
 */
export const getAz = (AwsRegionCode: string) => {
  switch (AwsRegionCode) {
    case 'us-east-1':
      return [
        `${AwsRegionCode}a`,
        `${AwsRegionCode}b`,
        `${AwsRegionCode}c`,
        `${AwsRegionCode}d`,
        `${AwsRegionCode}e`,
        `${AwsRegionCode}f`,
      ]
    case 'us-east-2':
      return [`${AwsRegionCode}a`, `${AwsRegionCode}b`, `${AwsRegionCode}c`]
    case 'us-west-2':
      return [
        `${AwsRegionCode}a`,
        `${AwsRegionCode}b`,
        `${AwsRegionCode}c`,
        `${AwsRegionCode}d`,
      ]
    case 'us-west-1':
      return [`${AwsRegionCode}a`, `${AwsRegionCode}c`]
    case 'ca-central-1':
      return [`${AwsRegionCode}a`, `${AwsRegionCode}b`]
    default:
      return []
  }
}

export const getAzWithMax = (AwsRegionCode: string, MaxCount: number) => {
  return getAz(AwsRegionCode).slice(0, MaxCount)
}
