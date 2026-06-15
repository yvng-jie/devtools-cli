import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { readStdinSync } from '../utils.js'
import { exitWithError } from '../errors.js'
import { createHelp } from '../help-builder.js'
import { parseCommonFlags } from '../parse-flags.js'
import { ask, isBack, pauseWithCopy, captureOutput } from '../interactive-utils.js'
import type { Command } from './types.js'

interface CharInfo {
  dec: number
  hex: string
  bin: string
  oct: string
  char: string
  category: string
}

function getCategory(code: number): string {
  if (code === 32) return 'space'
  if (code === 127) return 'control'
  if (code < 32) return 'control'
  if (code >= 48 && code <= 57) return 'digit'
  if (code >= 65 && code <= 90) return 'uppercase'
  if (code >= 97 && code <= 122) return 'lowercase'
  if (code >= 33 && code <= 47) return 'punctuation'
  if (code >= 58 && code <= 64) return 'punctuation'
  if (code >= 91 && code <= 96) return 'punctuation'
  if (code >= 123 && code <= 126) return 'punctuation'
  if (code >= 128) return 'extended'
  return 'unknown'
}

function displayChar(code: number): string {
  if (code === 32) return 'SP'
  if (code === 127) return 'DEL'
  if (code < 32) return code.toString(16).padStart(2, '0').toUpperCase()
  return String.fromCharCode(code)
}

function charInfo(input: string | number): CharInfo {
  const code = typeof input === 'number' ? input : input.charCodeAt(0)
  return {
    dec: code,
    hex: '0x' + code.toString(16).toUpperCase().padStart(2, '0'),
    bin: code.toString(2).padStart(8, '0'),
    oct: '0o' + code.toString(8).padStart(3, '0'),
    char: displayChar(code),
    category: getCategory(code),
  }
}

function printTable(start: number, end: number): void {
  console.log('')
  console.log(`  ${chalk.bold('ASCII Table')}  ${chalk.dim(`(${start}-${end})`)}`)
  console.log(`  ${chalk.dim('────' + '─'.repeat(42))}`)
  console.log(`  ${chalk.dim('Dec  Hex   Bin       Oct   Char  Category')}`)
  console.log(`  ${chalk.dim('──── ──── ───────── ───── ───── ─────────────')}`)

  for (let i = start; i <= end; i++) {
    const info = charInfo(i)
    const charStr = info.char === 'SP' ? chalk.dim('SP') :
      info.char.length === 2 && !/[A-Za-z0-9]/.test(info.char) ? chalk.dim(info.char) : chalk.white(info.char)
    console.log(
      `  ${chalk.cyan(String(info.dec).padEnd(4))} ` +
      `${chalk.green(info.hex.padEnd(6))} ${chalk.yellow(info.bin.padEnd(9))} ` +
      `${chalk.magenta(info.oct.padEnd(5))} ${String(charStr).padEnd(5)} ${chalk.dim(info.category)}`
    )
  }
  console.log('')
}

export function ascii(args: string[]) {
  const { flags, rest } = parseCommonFlags(args)

  let extended = false
  let range: [number, number] | null = null
  const inputArgs: string[] = []
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--extended') {
      extended = true
    } else if (rest[i] === '--range') {
      const raw = rest[i + 1]
      if (raw) {
        const parts = raw.split('-').map(Number)
        if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
          range = [parts[0], parts[1]]
          i++
        } else {
          exitWithError('--range must be in format "start-end" (e.g. "32-64")')
        }
      }
    } else {
      inputArgs.push(rest[i])
    }
  }

  const input = inputArgs.join(' ') || readStdinSync()

  // No input: show table
  if (!input) {
    const end = extended ? 255 : 127
    printTable(0, end)
    return
  }

  // Single character or numeric lookup
  let code = 0
  if (/^\d+$/.test(input)) {
    code = Number(input)
    if (code < 0 || code > 255) exitWithError('code must be between 0 and 255')
  } else if (input.length === 1) {
    code = input.charCodeAt(0)
  } else {
    exitWithError('provide a single character or numeric code')
  }

  const info = charInfo(code)

  if (flags.json) {
    console.log(JSON.stringify(info))
    return
  }

  if (range) {
    printTable(range[0], range[1])
    return
  }

  console.log('')
  console.log(`  ${chalk.bold('Character Info')}`)
  console.log(`  ${chalk.dim('────────────────')}`)
  console.log(`  ${chalk.dim('Char:')}      ${chalk.white(info.char)}`)
  console.log(`  ${chalk.dim('Decimal:')}  ${chalk.cyan(info.dec)}`)
  console.log(`  ${chalk.dim('Hex:')}      ${chalk.green(info.hex)}`)
  console.log(`  ${chalk.dim('Binary:')}   ${chalk.yellow(info.bin)}`)
  console.log(`  ${chalk.dim('Octal:')}    ${chalk.magenta(info.oct)}`)
  console.log(`  ${chalk.dim('Category:')} ${chalk.dim(info.category)}`)
  console.log('')
}

const asciiHelp = createHelp({
  name: 'ascii',
  description: 'ASCII / character lookup table',
  usage: 'dt ascii [value] [options]',
  options: [
    { flags: '--range <start-end>', desc: 'Show ASCII table subset (e.g. 32-64)' },
    { flags: '--extended', desc: 'Show extended ASCII (128-255)' },
  ],
  examples: [
    { cmd: 'dt ascii' },
    { cmd: 'dt ascii A' },
    { cmd: 'dt ascii 65' },
    { cmd: 'dt ascii "!" --range 32-64' },
    { cmd: 'dt ascii --extended' },
  ],
})

async function asciiInteractive(rl: ReturnType<typeof createInterface>): Promise<void> {
  const mode = (await ask(rl, `  ${chalk.yellow('?')} Lookup char/num or table? ${chalk.dim('(char/table)')}: `)).trim().toLowerCase()
  if (isBack(mode)) return
  if (mode === 'table' || mode === 't') {
    const ext = ((await ask(rl, `  ${chalk.yellow('?')} Include extended? ${chalk.dim('(y/N)')}: `)).trim().toLowerCase() === 'y')
    const output = captureOutput(() => ascii(ext ? ['--extended'] : []))
    await pauseWithCopy(rl, output)
  } else {
    const input = await ask(rl, `  ${chalk.yellow('?')} Character or code: `)
    if (isBack(input)) return
    const output = captureOutput(() => ascii(input ? [input] : []))
    await pauseWithCopy(rl, output)
  }
}

export const asciiCommand: Command = {
  name: 'ascii',
  aliases: [],
  category: 'data',
  description: 'ASCII / character lookup table',
  run: ascii,
  help: asciiHelp,
  interactive: asciiInteractive,
}
