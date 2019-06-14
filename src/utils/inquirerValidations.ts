export const validateNumber = (fieldName: string = 'number') => (
  input: number,
) => (!!input && input > 0) || `Please enter a valid ${fieldName}`

export const validateInput = (fieldName: string = 'input') => (input: string) =>
  !!input || `Please enter a valid ${fieldName}`
