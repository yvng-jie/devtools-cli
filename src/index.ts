import { showHelp, showVersion } from './help.js'
import { uuid, uuidHelp } from './commands/uuid.js'
import { base64 } from './commands/base64.js'
import { color } from './commands/color.js'
import { jwt } from './commands/jwt.js'
import { hash } from './commands/hash.js'
import { timestamp, timestampHelp } from './commands/timestamp.js'
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

  switch (cmd) {
    case 'help': {
      // dt help <command> — show specific help
      const helpCmd = args[0]
      if (helpCmd) {
        const helpMap: Record<string, () => void> = {
          uuid: uuidHelp,
          base64: () => base64(['--help']),
          color: () => color(['--help']),
          jwt: () => jwt(['--help']),
          hash: () => hash(['--help']),
          timestamp: timestampHelp,
          ts: timestampHelp,
        }
        if (helpMap[helpCmd]) {
          helpMap[helpCmd]()
          break
        }
      }
      showHelp()
      break
    }
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
    case 'timestamp':
    case 'ts':
      timestamp(args)
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
