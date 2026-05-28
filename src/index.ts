import { showHelp, showVersion } from './help.js'
import { uuid, uuidHelp } from './commands/uuid.js'
import { base64 } from './commands/base64.js'
import { color } from './commands/color.js'
import { jwt } from './commands/jwt.js'
import { hash } from './commands/hash.js'
import { interactive } from './interactive.js'
import { ExitError } from './errors.js'

async function main() {
  const rawArgs = process.argv.slice(2)
  const cmd = rawArgs[0]
  const args = rawArgs.slice(1)

  // No args → interactive mode
  if (cmd === undefined) {
    await interactive()
    return
  }

  // Handle --help / -h on specific commands
  if (args[0] === '--help' || args[0] === '-h') {
    switch (cmd) {
      case 'uuid':
        uuidHelp()
        return
      case 'jwt':
        jwt(args)
        return
      case 'color':
        color(args)
        return
      case 'base64':
        base64(args)
        return
      case 'hash':
        hash(args)
        return
    }
  }

  switch (cmd) {
    case 'help':
    case '--help':
    case '-h':
      showHelp()
      break
    case '--version':
    case '-v':
      showVersion()
      break
    case 'uuid':
      uuid(args)
      break
    case 'base64':
      base64(args)
      break
    case 'color':
      color(args)
      break
    case 'jwt':
      jwt(args)
      break
    case 'hash':
      hash(args)
      break
    default:
      throw new ExitError(`Unknown command: ${cmd}\n  Run 'dt help' for available commands.`)
  }
}

main().catch((err) => {
  if (err instanceof ExitError) {
    process.exit(1)
  }
  console.error('Fatal error:', err)
  process.exit(1)
})
