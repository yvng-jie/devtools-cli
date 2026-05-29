import { createHash } from 'node:crypto'
import chalk from 'chalk'
import { readStdinSync } from '../utils.js'
import { exitWithError } from '../errors.js'

const ALGOS = ['sha1', 'sha256', 'sha384', 'sha512'] as const
type Algo = (typeof ALGOS)[number]

export function hash(args: string[]) {
  if (args[0] === '--help' || args[0] === '-h') {
    hashHelp()
    return
  }

  const jsonMode = args.includes('--json')
  const filteredArgs = args.filter((a) => a !== '--json')

  let algo: Algo = 'sha256'

  // Parse --algo / -a
  const algoIdx = filteredArgs.indexOf('--algo') !== -1 ? filteredArgs.indexOf('--algo') : filteredArgs.indexOf('-a')
  if (algoIdx >= 0) {
    const raw = filteredArgs[algoIdx + 1]?.toLowerCase()
    if (raw && ALGOS.includes(raw as Algo)) {
      algo = raw as Algo
    } else {
      exitWithError(`unsupported algorithm "${raw}" (supported: ${ALGOS.join(', ')})`)
    }
  }

  // Exclude --algo/-a and its value, take everything else as input
  const input =
    algoIdx >= 0
      ? filteredArgs
          .slice(0, algoIdx)
          .concat(filteredArgs.slice(algoIdx + 2))
          .join(' ')
      : filteredArgs.join(' ')
  const finalInput = input || readStdinSync()

  if (!finalInput) {
    exitWithError('no input provided')
  }

  const hex = createHash(algo).update(finalInput).digest('hex')

  if (jsonMode) {
    console.log(JSON.stringify({ algorithm: algo.toUpperCase(), input: finalInput, hash: hex }))
    return
  }

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
