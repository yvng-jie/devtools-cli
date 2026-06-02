import { createHash, createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import chalk from 'chalk'
import { readStdinSync } from '../utils.js'
import { exitWithError } from '../errors.js'
import type { Command } from './types.js'

const ALGOS = ['sha1', 'sha256', 'sha384', 'sha512'] as const
type Algo = (typeof ALGOS)[number]

/** Parse named flags from args, returning the remaining positional args. */
function parseFlags(args: string[]): {
  json: boolean
  algo: Algo
  file: string | null
  key: string | null
  rest: string[]
} {
  const result = {
    json: false,
    algo: 'sha256' as Algo,
    file: null as string | null,
    key: null as string | null,
    rest: [] as string[],
  }
  const skip = new Set<number>()

  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (skip.has(i)) continue

    if (a === '--json') {
      result.json = true
    } else if (a === '--algo' || a === '-a') {
      const raw = args[i + 1]?.toLowerCase()
      if (raw && ALGOS.includes(raw as Algo)) {
        result.algo = raw as Algo
        skip.add(i + 1)
      } else {
        exitWithError(`unsupported algorithm "${raw}" (supported: ${ALGOS.join(', ')})`)
      }
    } else if (a === '--file' || a === '-f') {
      result.file = args[i + 1] ?? null
      skip.add(i + 1)
    } else if (a === '--key' || a === '-k') {
      result.key = args[i + 1] ?? null
      skip.add(i + 1)
    } else {
      result.rest.push(a)
    }
  }

  return result
}

export function hash(args: string[]) {
  const { json: jsonMode, algo, file, key, rest } = parseFlags(args)

  // Resolve input: --file path, positional text, or stdin
  let finalInput = ''
  if (file) {
    try {
      finalInput = readFileSync(file, 'utf-8')
    } catch {
      exitWithError(`cannot read file "${file}"`)
    }
  } else {
    finalInput = rest.join(' ') || readStdinSync()
  }

  if (!finalInput) {
    exitWithError('no input provided')
  }
  const _input = finalInput

  let hex: string
  if (key) {
    hex = createHmac(algo, key).update(_input).digest('hex')
    if (jsonMode) {
      console.log(JSON.stringify({ algorithm: 'HMAC-' + algo.toUpperCase(), input: _input, hash: hex, key }))
      return
    }
    console.log('')
    console.log(`  ${chalk.dim('Algorithm:')} ${chalk.yellow('HMAC-' + algo.toUpperCase())}`)
    console.log(`  ${chalk.dim('Key:')}       ${chalk.yellow(key)}`)
    console.log(`  ${chalk.dim('Input:')}     ${chalk.white(_input.slice(0, 60))}${_input.length > 60 ? '...' : ''}`)
    console.log(`  ${chalk.dim('Hash:')}      ${chalk.green(hex)}`)
    console.log('')
    return
  }

  hex = createHash(algo).update(_input).digest('hex')

  if (jsonMode) {
    console.log(JSON.stringify({ algorithm: algo.toUpperCase(), input: _input, hash: hex }))
    return
  }

  console.log('')
  console.log(`  ${chalk.dim('Algorithm:')} ${chalk.yellow(algo.toUpperCase())}`)
  if (file) {
    console.log(`  ${chalk.dim('File:')}      ${chalk.white(file)}`)
  }
  console.log(`  ${chalk.dim('Input:')}     ${chalk.white(_input.slice(0, 60))}${_input.length > 60 ? '...' : ''}`)
  console.log(`  ${chalk.dim('Hash:')}      ${chalk.green(hex)}`)
  console.log('')
}

function hashHelp() {
  console.log(chalk.bold('\n  hash — Generate SHA hashes'))
  console.log(`  ${chalk.dim('────')}`)
  console.log('')
  console.log(`  ${chalk.yellow('Usage:')}`)
  console.log('    dt hash <text> [options]')
  console.log('    dt hash --file <path> [options]')
  console.log('    echo <text> | dt hash [options]')
  console.log('')
  console.log(`  ${chalk.yellow('Algorithms:')}`)
  console.log('    sha1, sha256 (default), sha384, sha512')
  console.log('')
  console.log(`  ${chalk.yellow('Options:')}`)
  console.log('    --algo, -a <algo>   Hash algorithm (default: sha256)')
  console.log('    --file, -f <path>   Hash file contents')
  console.log('    --key, -k <secret>  HMAC key (enables keyed-hash authentication)')
  console.log('')
  console.log(`  ${chalk.yellow('Examples:')}`)
  console.log('    dt hash "hello"')
  console.log('    dt hash "hello" --algo sha512')
  console.log('    dt hash --file config.json')
  console.log('    dt hash "hello" --key mysecret')
  console.log('    echo "hello" | dt hash')
  console.log('')
}

export const hashCommand: Command = {
  name: 'hash',
  aliases: [],
  description: 'Generate SHA hashes (sha1/256/384/512)',
  run: hash,
  help: hashHelp,
}
