import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { readStdinSync } from '../utils.js'
import { exitWithError } from '../errors.js'
import { createHelp } from '../help-builder.js'
import { parseCommonFlags } from '../parse-flags.js'
import { ask, isBack, pauseWithCopy, captureOutput } from '../interactive-utils.js'
import type { Command } from './types.js'

type OutputFormat = 'hex' | 'binary' | 'octal' | 'decimal'

interface ParsedInput {
  decimal: number
  original: string
}

function parseInput(raw: string): ParsedInput {
  const s = raw.trim()
  if (/^0x/i.test(s)) {
    const n = parseInt(s, 16)
    if (!Number.isNaN(n)) return { decimal: n, original: s }
  } else if (/^0b/i.test(s)) {
    const n = parseInt(s.slice(2), 2)
    if (!Number.isNaN(n)) return { decimal: n, original: s }
  } else if (/^0o/i.test(s)) {
    const n = parseInt(s.slice(2), 8)
    if (!Number.isNaN(n)) return { decimal: n, original: s }
  } else if (/^#/.test(s)) {
    const n = parseInt(s.slice(1), 16)
    if (!Number.isNaN(n)) return { decimal: n, original: s }
  } else {
    const n = Number(s)
    if (!Number.isNaN(n) && Number.isInteger(n) && s !== '') return { decimal: n, original: s }
  }
  throw new Error(`could not parse "${raw}" as a number`)
}

function formatOutput(n: number): Record<string, string> {
  return {
    decimal: n.toString(10),
    hex: '0x' + n.toString(16).toUpperCase(),
    binary: '0b' + n.toString(2),
    octal: '0o' + n.toString(8),
  }
}

const FORMATS: OutputFormat[] = ['decimal', 'hex', 'binary', 'octal']

export function number(args: string[]) {
  const { flags, rest } = parseCommonFlags(args)

  let to: OutputFormat | null = null
  const inputArgs: string[] = []
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--to') {
      const raw = rest[i + 1]?.toLowerCase()
      if (raw && FORMATS.includes(raw as OutputFormat)) {
        to = raw as OutputFormat
        i++
      } else {
        exitWithError(`unsupported format "${rest[i + 1]}" (supported: ${FORMATS.join(', ')})`)
      }
    } else {
      inputArgs.push(rest[i])
    }
  }

  const raw = inputArgs.join(' ') || readStdinSync()
  if (!raw) {
    exitWithError('provide a number to convert (e.g. "255" or "0xFF")')
  }

  const { decimal } = parseInput(raw)
  const all = formatOutput(decimal)

  if (flags.json) {
    console.log(JSON.stringify(all))
    return
  }

  if (to) {
    console.log(chalk.green(all[to]))
    return
  }

  console.log('')
  console.log(`  ${chalk.bold('Number Base Converter')}`)
  console.log(`  ${chalk.dim('Input:')}     ${chalk.white(raw)}`)
  console.log('')
  for (const fmt of FORMATS) {
    const label = fmt.padEnd(9)
    const color = fmt === 'decimal' ? chalk.white : chalk.green
    console.log(`  ${chalk.dim(label)} ${color(all[fmt])}`)
  }
  console.log('')
}

const numberHelp = createHelp({
  name: 'number',
  description: 'Convert numbers between decimal, hex, binary, octal',
  usage: 'dt number <value> [options]',
  options: [
    { flags: '--to <format>', desc: 'Output format (decimal, hex, binary, octal)' },
  ],
  extra: [
    `  ${chalk.yellow('Supported input formats:')}`,
    '    Decimal:     255',
    '    Hexadecimal: 0xFF, #FF',
    '    Binary:      0b11111111',
    '    Octal:       0o377',
    '',
  ],
  examples: [
    { cmd: 'dt number 255' },
    { cmd: 'dt number "0xFF"' },
    { cmd: 'dt number "0b11111111" --to hex' },
    { cmd: 'dt number 255 --to binary' },
    { cmd: 'echo "255" | dt number --to hex' },
  ],
})

async function numberInteractive(rl: ReturnType<typeof createInterface>): Promise<void> {
  const input = await ask(rl, `  ${chalk.yellow('?')} Number to convert (e.g. 255 or 0xFF): `)
  if (isBack(input)) return
  const output = captureOutput(() => number(input ? [input] : []))
  await pauseWithCopy(rl, output)
}

export const numberCommand: Command = {
  name: 'number',
  aliases: ['num'],
  category: 'math',
  description: 'Convert numbers between decimal, hex, binary, octal',
  run: number,
  help: numberHelp,
  interactive: numberInteractive,
}
