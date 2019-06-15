const { sdk } = require('@cto.ai/sdk')
const shell = require('shelljs')

async function main() {
  const argv = sdk.yargs.argv

  const { stdout: UUID } = await sdk.exec('echo "tensorflow-$(uuidgen)"')

  switch(argv._[0]) {
    case 'create':
      await sdk.exec(`./src/scripts/create.sh ${UUID}`)
      break;
    case 'destroy':
      await sdk.exec(`./src/scripts/destroy.sh ${UUID}`)
      break;
    default:
      break;
  }
}

main()
