import { ux } from '@cto.ai/sdk'

/**
 * Creates a blocking progress bar that finishes at timeoutTotal
 * @param timeoutTotal The timeout desired until the progress bar completes
 */
export const generateProgressBar = async (timeoutTotal: number) => {
  const bar = ux.progress.init()
  bar.start(100, 0)
  for (let i = 0; i < 100; i++) {
    bar.update(i)
    await new Promise(resolve => setTimeout(resolve, timeoutTotal / 100))
  }
  bar.update(100)
  bar.stop()
}
