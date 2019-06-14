import { create } from './commands/create'
import { destroyCluster } from './commands/destroy'
import { update } from './commands/update'
import { generateResources } from './commands/generate-resources'

const COMMANDS = {
  CREATE: 'create',
  DESTROY: 'destroy',
  UPDATE: 'update',
  GENERATE_RESOURCES: 'generate-resources',
}

const main = async () => {
  const [arg] = process.argv.slice(2)

  switch (arg) {
    case COMMANDS.CREATE: {
      await create()
      break
    }
    case COMMANDS.DESTROY: {
      await destroyCluster()
      break
    }
    case COMMANDS.UPDATE: {
      await update()
      break
    }
    case COMMANDS.GENERATE_RESOURCES:
      await generateResources()
      break
    default: {
      console.log(
        `A command is required. Please select one of ${Object.values(
          COMMANDS,
        )}`,
      )
      break
    }
  }
}

main()
