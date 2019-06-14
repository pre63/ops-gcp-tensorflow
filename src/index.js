const { sdk } = require('@cto.ai/sdk')
const shell = require('shelljs')

async function main() {
  const res = await sdk.user().catch(err => console.log(err))
  const person = res && res.me ? `, ${res.me.username}` : ' there'
  const greeting = `\n👋 Hi${person}! This template will run the demo for CTO.ai CLI SDK where you'll see some basic interactions that are included. This will allow you to easily create a simple-to-use automation.`

  shell.exec('pwd');
  shell.exec('ls -la');
  shell.exec('./src/index.sh');
}

main()
