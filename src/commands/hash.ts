import { createHash, createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { readStdinSync } from '../utils.js'
import { exitWithError } from '../errors.js'
import { createHelp } from '../help-builder.js'
import { parseCommonFlags } from '../parse-flags.js'
import { ask, isBack, pauseWithCopy, captureOutput } from '../interactive-utils.js'
import type { Command } from './types.js'

const ALGOS = ['sha1', 'sha256', 'sha384', 'sha512'] as const
type Algo = (typeof ALGOS)[number]

function parseFlags(args: string[]): {
  json: boolean
  algo: Algo
  file: string | null
  key: string | null
  rest: string[]
} {
  const { flags, rest } = parseCommonFlags(args)
  const result = {
    json: flags.json,
    algo: 'sha256' as Algo,
    file: null as string | null,
    key: null as string | null,
    rest: [] as string[],
  }

  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]
    if (a === '--algo' || a === '-a') {
      const raw = rest[i + 1]?.toLowerCase()
      if (raw && ALGOS.includes(raw as Algo)) {
        result.algo = raw as Algo
        i++
      } else {
        exitWithError(`unsupported algorithm "${raw}" (supported: ${ALGOS.join(', ')})`)
      }
    } else if (a === '--file' || a === '-f') {
      result.file = rest[i + 1] ?? null
      i++
    } else if (a === '--key' || a === '-k') {
      result.key = rest[i + 1] ?? null
      i++
    } else {
      result.rest.push(a)
    }
  }

  return result
}

export function hash(args: string[]) {
  const { json: jsonMode, algo, file, key, rest } = parseFlags(args)

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

  let hex: string
  if (key) {
    hex = createHmac(algo, key).update(finalInput).digest('hex')
    if (jsonMode) {
      console.log(JSON.stringify({ algorithm: 'HMAC-' + algo.toUpperCase(), input: finalInput, hash: hex, key: '[REDACTED]' }))
      return
    }
    console.log('')
    console.log(`  ${chalk.dim('Algorithm:')} ${chalk.yellow('HMAC-' + algo.toUpperCase())}`)
    console.log(`  ${chalk.dim('Key:')}       ${chalk.yellow('[REDACTED]')}`)
    console.log(`  ${chalk.dim('Input:')}     ${chalk.white(finalInput.slice(0, 60))}${finalInput.length > 60 ? '...' : ''}`)
    console.log(`  ${chalk.dim('Hash:')}      ${chalk.green(hex)}`)
    console.log('')
    return
  }

  hex = createHash(algo).update(finalInput).digest('hex')

  if (jsonMode) {
    console.log(JSON.stringify({ algorithm: algo.toUpperCase(), input: finalInput, hash: hex }))
    return
  }

  console.log('')
  console.log(`  ${chalk.dim('Algorithm:')} ${chalk.yellow(algo.toUpperCase())}`)
  if (file) {
    console.log(`  ${chalk.dim('File:')}      ${chalk.white(file)}`)
  }
  console.log(`  ${chalk.dim('Input:')}     ${chalk.white(finalInput.slice(0, 60))}${finalInput.length > 60 ? '...' : ''}`)
  console.log(`  ${chalk.dim('Hash:')}      ${chalk.green(hex)}`)
  console.log('')
}

const hashHelp = createHelp({
  name: 'hash',
  description: 'Generate SHA hashes (sha1/256/384/512)',
  usage: 'dt hash <text> [options]',
  options: [
    { flags: '--algo, -a <algo>', desc: 'Hash algorithm (default: sha256)' },
    { flags: '--file, -f <path>', desc: 'Hash file contents' },
    { flags: '--key, -k <secret>', desc: 'HMAC key (enables keyed-hash authentication)' },
  ],
  extra: [`  ${chalk.yellow('Algorithms:')}`, '    sha1, sha256 (default), sha384, sha512', ''],
  examples: [
    { cmd: 'dt hash "hello"' },
    { cmd: 'dt hash "hello" --algo sha512' },
    { cmd: 'dt hash --file config.json' },
    { cmd: 'dt hash "hello" --key mysecret' },
    { cmd: 'echo "hello" | dt hash' },
  ],
})

async function hashInteractive(rl: ReturnType<typeof createInterface>): Promise<void> {
  const input = await ask(rl, `  ${chalk.yellow('?')} Text to hash: `)
  if (isBack(input)) return
  const algo = (
    await ask(
      rl,
      `  ${chalk.yellow('?')} Algorithm ${chalk.dim('(sha256/sha1/sha384/sha512)')} ${chalk.dim('[sha256]')}: `,
    )
  ).trim()
  if (isBack(algo)) return
  const output = captureOutput(() => hash(input ? (algo ? [input, '--algo', algo] : [input]) : []))
  await pauseWithCopy(rl, output)
}

export const hashCommand: Command = {
  name: 'hash',
  aliases: [],
  category: 'crypto',
  description: 'Generate SHA hashes (sha1/256/384/512)',
  run: hash,
  help: hashHelp,
  interactive: hashInteractive,
}
