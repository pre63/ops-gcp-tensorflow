const { sdk } = require('@cto.ai/sdk')
const shell = require('shelljs')

async function main() {
  const argv = sdk.yargs.argv

  switch(argv._[0]) {
    case 'create':
      shell.exec('./src/index.sh');
      break;
    case 'destroy':
      break;
    default:
      break;
  }
}

main()
