const { sdk } = require('@cto.ai/sdk')
const shell = require('shelljs')

async function main() {
  shell.exec('./src/index.sh');
}

main()
