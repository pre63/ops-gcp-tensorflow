import { train } from './commands/train'
// import { destroyCluster } from './commands/destroy'
// import { update } from './commands/update'
// import { generateResources } from './commands/generate-resources'

const COMMANDS = {
  TRAIN: 'train',
  // DESTROY: 'destroy',
  // UPDATE: 'update',
  // GENERATE_RESOURCES: 'generate-resources',
}

const main = async () => {
  const [arg] = process.argv.slice(2)
  const [file] = process.argv.slice(3)
  console.log('arg:', arg);
  console.log('file:', file);

  switch (arg) {
    case COMMANDS.TRAIN: {
      await train(file)
      break
    }

    // case COMMANDS.DESTROY: {
    //   await destroyCluster()
    //   break
    // }

    // case COMMANDS.UPDATE: {
    //   await update()
    //   break
    // }
    // case COMMANDS.GENERATE_RESOURCES:
    //   await generateResources()
    //   break
    // default: {
    //   console.log(
    //     `A command is required. Please select one of ${Object.values(
    //       COMMANDS,
    //     )}`,
    //   )
    //   break
    // }
  }
}

main()
