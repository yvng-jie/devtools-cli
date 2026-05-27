import { createHash } from 'node:crypto'
import chalk from 'chalk'
import { readStdinSync } from '../utils.js'

const ALGOS = ['sha1', 'sha256', 'sha384', 'sha512'] as const
type Algo = (typeof ALGOS)[number]

export function hash(args: string[]) {
  if (args[0] === '--help' || args[0] === '-h') {
    hashHelp()
    return
  }

  let algo: Algo = 'sha256'
  let inputStart = 0

  // Parse --algo / -a
  const algoIdx = args.indexOf('--algo') !== -1 ? args.indexOf('--algo') : args.indexOf('-a')
  if (algoIdx >= 0) {
    const raw = args[algoIdx + 1]?.toLowerCase()
    if (raw && ALGOS.includes(raw as Algo)) {
      algo = raw as Algo
      inputStart = algoIdx + 2
    } else {
      console.log(chalk.red(`Error: unsupported algorithm "${raw}"`))
      console.log(chalk.dim(`  Supported: ${ALGOS.join(', ')}`))
      process.exit(1)
    }
  }

  // Exclude --algo/-a and its value, take everything else as input
  const input =
    algoIdx >= 0
      ? args
          .slice(0, algoIdx)
          .concat(args.slice(algoIdx + 2))
          .join(' ')
      : args.slice(inputStart).join(' ')
  const finalInput = input || readStdinSync()

  if (!finalInput) {
    console.log(chalk.red('Error: no input provided'))
    process.exit(1)
  }

  const hex = createHash(algo).update(finalInput).digest('hex')

  console.log('')
  console.log(`  ${chalk.dim('Algorithm:')} ${chalk.yellow(algo.toUpperCase())}`)
  console.log(
    `  ${chalk.dim('Input:')}     ${chalk.white(finalInput.slice(0, 60))}${finalInput.length > 60 ? '...' : ''}`,
  )
  console.log(`  ${chalk.dim('Hash:')}      ${chalk.green(hex)}`)
  console.log('')
}

function hashHelp() {
  console.log(chalk.bold('\n  hash — Generate SHA hashes'))
  console.log(`  ${chalk.dim('────')}`)
  console.log('')
  console.log(`  ${chalk.yellow('Usage:')}`)
  console.log('    dt hash <text> [--algo <algo>]')
  console.log('    echo <text> | dt hash [--algo <algo>]')
  console.log('')
  console.log(`  ${chalk.yellow('Algorithms:')}`)
  console.log('    sha1, sha256 (default), sha384, sha512')
  console.log('')
  console.log(`  ${chalk.yellow('Options:')}`)
  console.log('    --algo, -a   Hash algorithm (default: sha256)')
  console.log('')
  console.log(`  ${chalk.yellow('Examples:')}`)
  console.log('    dt hash "hello"')
  console.log('    dt hash "hello" --algo sha512')
  console.log('    echo "hello" | dt hash')
  console.log('')
}
