export const getFlags = (): string[] =>
  process.argv.filter(arg => arg.startsWith('-'))
