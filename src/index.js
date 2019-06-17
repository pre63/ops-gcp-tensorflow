const { sdk } = require('@cto.ai/sdk')
const shell = require('shelljs')

async function main() {
  const argv = sdk.yargs.argv

  const { stdout: UUID } = await sdk.exec('echo "tensorflow-$(uuidgen)"')

  switch(argv._[0]) {
    case 'create':
      console.log('Tip: You can also pass in a -d flag to destroy the instance after it runs your python code');
      shell.exec(`./src/scripts/create.sh ${UUID}`) // still using shell to pipe stdout

      if (argv.d || argv.destroy) {
        shell.exec(`./src/scripts/destroy.sh ${UUID}`)
      }
      break;
    case 'destroy':
      if (!argv._ || argv._.length < 2) {
        console.log('Please specify a stack name to delete');
        process.exit(1)
      }
      const desiredUUID = argv._[1]

      shell.exec(`./src/scripts/destroy.sh ${desiredUUID}`) // still using shell to pipe stdout
      break;
    default:
      console.log('Please specify a command as an argument to the op. Valid commands are create and destroy');
      break;
  }
}

main()
