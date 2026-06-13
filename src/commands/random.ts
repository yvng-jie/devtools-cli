import { randomInt } from 'node:crypto'
import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { exitWithError } from '../errors.js'
import { createHelp } from '../help-builder.js'
import { parseCommonFlags } from '../parse-flags.js'
import { ask, isBack, pauseWithCopy, captureOutput } from '../interactive-utils.js'
import type { Command } from './types.js'

const PASS_LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const PASS_UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const PASS_DIGITS = '0123456789'
const PASS_SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'

function generatePassword(length: number, useSymbols: boolean): string {
  const chars = PASS_LOWERCASE + PASS_UPPERCASE + PASS_DIGITS + (useSymbols ? PASS_SYMBOLS : '')
  const buf = new Uint8Array(length)
  crypto.getRandomValues(buf)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[buf[i] % chars.length]
  }
  return result
}

export function random(args: string[]) {
  const { flags, rest } = parseCommonFlags(args)

  let mode = 'password'
  let length = 16
  let useSymbols = true
  let count = 1
  let min = 0,
    max = 100

  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]
    if (a === 'password' || a === 'number') {
      mode = a
    } else if (a === '--length' || a === '-l') {
      const raw = rest[i + 1]
      const parsed = Number(raw)
      if (!Number.isInteger(parsed) || parsed < 4 || parsed > 256) {
        exitWithError('--length must be an integer between 4 and 256')
      }
      length = parsed
      i++
    } else if (a === '--no-symbols') {
      useSymbols = false
    } else if (a === '--count' || a === '-c') {
      const raw = rest[i + 1]
      const parsed = Number(raw)
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
        exitWithError('--count must be an integer between 1 and 100')
      }
      count = parsed
      i++
    } else if (a === '--min') {
      min = Number(rest[i + 1]) || 0
      i++
    } else if (a === '--max') {
      max = Number(rest[i + 1]) || 100
      i++
    }
  }

  if (mode === 'password') {
    const passwords = Array.from({ length: count }, () => generatePassword(length, useSymbols))
    if (flags.json) {
      console.log(JSON.stringify({ mode, length, symbols: useSymbols, passwords }))
    } else {
      for (const pw of passwords) {
        console.log(chalk.green(pw))
      }
    }
  } else {
    const nums = Array.from({ length: count }, () => randomInt(min, max + 1))
    if (flags.json) {
      console.log(JSON.stringify({ mode, min, max, numbers: nums }))
    } else {
      for (const n of nums) {
        console.log(chalk.yellow(String(n)))
      }
    }
  }
}

const randomHelp = createHelp({
  name: 'random',
  description: 'Generate passwords & random numbers',
  usage: 'dt random <password|number> [options]',
  options: [
    { flags: '--length, -l <n>', desc: 'Length of password (default: 16, range: 4-256)' },
    { flags: '--no-symbols', desc: 'Exclude symbols from password' },
    { flags: '--count, -c <n>', desc: 'Number of values to generate (default: 1, max: 100)' },
    { flags: '--min <n>', desc: 'Minimum value for random number (default: 0)' },
    { flags: '--max <n>', desc: 'Maximum value for random number (default: 100)' },
  ],
  examples: [
    { cmd: 'dt random password' },
    { cmd: 'dt random password -l 32 --no-symbols' },
    { cmd: 'dt random number --min 1 --max 10' },
    { cmd: 'dt random password -c 5' },
  ],
})

async function randomInteractive(rl: ReturnType<typeof createInterface>): Promise<void> {
  const mode = (await ask(rl, `  ${chalk.yellow('?')} password or number? ${chalk.dim('(password)')}: `))
    .trim()
    .toLowerCase()
  if (isBack(mode)) return
  if (mode === 'number') {
    const min = (await ask(rl, `  ${chalk.yellow('?')} Min ${chalk.dim('(0)')}: `)).trim()
    if (isBack(min)) return
    const max = (await ask(rl, `  ${chalk.yellow('?')} Max ${chalk.dim('(100)')}: `)).trim()
    if (isBack(max)) return
    const output = captureOutput(() =>
      random(['number', ...(min ? ['--min', min] : []), ...(max ? ['--max', max] : [])]),
    )
    await pauseWithCopy(rl, output)
  } else {
    const length = (await ask(rl, `  ${chalk.yellow('?')} Length ${chalk.dim('(16)')}: `)).trim()
    if (isBack(length)) return
    const symbols = (await ask(rl, `  ${chalk.yellow('?')} Include symbols? ${chalk.dim('(Y/n)')}: `))
      .trim()
      .toLowerCase()
    const output = captureOutput(() =>
      random(['password', ...(length ? ['--length', length] : []), ...(symbols === 'n' ? ['--no-symbols'] : [])]),
    )
    await pauseWithCopy(rl, output)
  }
}

export const randomCommand: Command = {
  name: 'random',
  aliases: ['rand'],
  category: 'utility',
  description: 'Generate passwords & random numbers',
  run: random,
  help: randomHelp,
  interactive: randomInteractive,
}
