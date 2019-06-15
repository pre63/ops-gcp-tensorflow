const { sdk } = require('@cto.ai/sdk')
const shell = require('shelljs')

async function main() {
  const argv = sdk.yargs.argv

  const { stdout: UUID } = await sdk.exec('echo "tensorflow-$(uuidgen)"')

  switch(argv._[0]) {
    case 'create':
      shell.exec(`./src/scripts/create.sh ${UUID}`) // still using shell to pipe stdout
      break;
    case 'destroy':
      shell.exec(`./src/scripts/destroy.sh ${UUID}`) // still using shell to pipe stdout
      break;
    default:
      break;
  }
}

main()
