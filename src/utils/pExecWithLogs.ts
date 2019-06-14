import * as util from 'util'
import * as childProcess from 'child_process'
import { ux } from '@cto.ai/sdk'

const promisifiedExec = util.promisify(childProcess.exec)

export const pExecWithLogs = async (command: string) => {
  console.log(
    ux.colors.reset.bold(`Running ${ux.colors.reset.magenta(command)}`),
  )

  const { stdout, stderr } = await promisifiedExec(command)
  if (stdout) console.log(stdout)
  if (stderr) console.error(stderr)

  return { stdout, stderr }
}
