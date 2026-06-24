import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { readStdinSync } from '../utils.js'
import { exitWithError } from '../errors.js'
import { createHelp } from '../help-builder.js'
import { parseCommonFlags } from '../parse-flags.js'
import { ask, isBack, pauseWithCopy, captureOutput } from '../interactive-utils.js'
import type { Command } from './types.js'

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const
type Unit = (typeof UNITS)[number]
const BINARY = 1024
const SI = 1000

function parseInput(raw: string): { bytes: number; si: boolean } {
  const m = raw.match(/^([\d.]+)\s*(B|KB|MB|GB|TB|PB|KiB|MiB|GiB|TiB|PiB)?$/i)
  if (m) {
    const val = Number(m[1])
    const unit = m[2]?.toUpperCase().replace(/I/, 'U') ?? 'B'
    const idx = UNITS.indexOf(unit as Unit)
    if (idx !== -1) return { bytes: Math.round(val * Math.pow(BINARY, idx)), si: false }
  }
  const num = Number(raw)
  if (!Number.isNaN(num) && num >= 0) return { bytes: Math.round(num), si: false }
  throw new Error(`could not parse "${raw}" as a byte value`)
}

function convert(bytes: number, si: boolean): Record<Unit, string> {
  const base = si ? SI : BINARY
  const result = {} as Record<Unit, string>
  for (let i = 0; i < UNITS.length; i++) {
    const val = bytes / Math.pow(base, i)
    result[UNITS[i]] = val < 0.01 && i > 0 ? '<0.01' : val.toFixed(2)
  }
  return result
}

function bytes(args: string[]) {
  const { flags, rest } = parseCommonFlags(args)

  let si = false
  let toUnit: Unit | null = null
  const inputArgs: string[] = []
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]
    if (a === '--si') {
      si = true
    } else if (a === '--to') {
      const raw = rest[i + 1]?.toUpperCase()
      if (raw && UNITS.includes(raw as Unit)) {
        toUnit = raw as Unit
        i++
      } else {
        exitWithError(`unsupported unit "${rest[i + 1]}" (supported: ${UNITS.join(', ')})`)
      }
    } else {
      inputArgs.push(a)
    }
  }

  const raw = inputArgs.join(' ') || readStdinSync()
  if (!raw) {
    exitWithError('provide a byte value (e.g. "1048576" or "1.5 GB")')
  }

  const { bytes: byteVal } = parseInput(raw)
  const all = convert(byteVal, si)

  if (flags.json) {
    const jsonOut: Record<string, number | string> = { bytes: byteVal, si: String(si) }
    if (toUnit) {
      jsonOut[toUnit.toLowerCase()] = Number(all[toUnit])
    } else {
      for (const u of UNITS) jsonOut[u.toLowerCase()] = Number(all[u])
    }
    console.log(JSON.stringify(jsonOut))
    return
  }

  if (toUnit) {
    console.log(chalk.green(all[toUnit] + ' ' + toUnit))
    return
  }

  console.log('')
  console.log(`  ${chalk.bold('Byte Converter')}  ${chalk.dim(si ? '(SI: 1000-based)' : '(binary: 1024-based)')}`)
  console.log(`  ${chalk.dim('Input:')}    ${chalk.white(raw)}`)
  console.log(`  ${chalk.dim('Bytes:')}    ${chalk.white(byteVal.toLocaleString())}`)
  console.log('')
  for (const u of UNITS) {
    const label = u.padEnd(6)
    console.log(`  ${chalk.green(label)} ${chalk.white(all[u])}`)
  }
  console.log('')
}

const bytesHelp = createHelp({
  name: 'bytes',
  description: 'Convert byte sizes (B, KB, MB, GB, TB, PB)',
  usage: 'dt bytes <value> [options]',
  options: [
    { flags: '--to <unit>', desc: 'Output unit (B, KB, MB, GB, TB, PB)' },
    { flags: '--si', desc: 'Use SI units (1000-based instead of 1024)' },
  ],
  examples: [
    { cmd: 'dt bytes 1048576' },
    { cmd: 'dt bytes "1.5 GB"' },
    { cmd: 'dt bytes 1048576 --to mb' },
    { cmd: 'dt bytes 1073741824 --si' },
    { cmd: 'echo "1048576" | dt bytes' },
  ],
})

async function bytesInteractive(rl: ReturnType<typeof createInterface>): Promise<void> {
  const input = await ask(rl, `  ${chalk.yellow('?')} Byte value (e.g. 1048576 or "1.5 GB"): `)
  if (isBack(input)) return
  const output = captureOutput(() => bytes(input ? [input] : []))
  await pauseWithCopy(rl, output)
}

export const bytesCommand: Command = {
  name: 'bytes',
  aliases: [],
  category: 'utility',
  description: 'Convert byte sizes (B, KB, MB, GB, TB, PB)',
  run: bytes,
  help: bytesHelp,
  interactive: bytesInteractive,
}
