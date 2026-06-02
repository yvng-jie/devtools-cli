import chalk from 'chalk'
import { exitWithError } from '../errors.js'
import { readStdinSync } from '../utils.js'
import type { Command } from './types.js'

/**
 * Format a Date object to a local date-time string (YYYY-MM-DD HH:mm:ss).
 */
function formatLocal(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/**
 * Format a Date object to a UTC date-time string (YYYY-MM-DD HH:mm:ss).
 */
function formatUtc(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

/**
 * Try to parse a date string. Returns a Date or null if unparseable.
 * Supports:
 *   - Unix timestamp (seconds, all digits)
 *   - ISO 8601 and many natural date strings (via Date.parse)
 *   - "now" keyword
 */
function parseDateInput(input: string): Date | null {
  const trimmed = input.trim()

  // "now" keyword → current time
  if (trimmed.toLowerCase() === 'now') {
    return new Date()
  }

  // All digits → treat as Unix timestamp (seconds)
  if (/^\d+$/.test(trimmed)) {
    const d = new Date(Number(trimmed) * 1000)
    return Number.isNaN(d.getTime()) ? null : d
  }

  // Otherwise try natural date parsing
  const d = new Date(trimmed)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Format a Date in a specific IANA timezone (YYYY-MM-DD HH:mm:ss).
 */
function formatInTimezone(d: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d)

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`
}

export function timestamp(args: string[]) {
  const jsonMode = args.includes('--json')

  // Parse flags and extract input arg
  let useUtc = false
  let useIso = false
  let timezone: string | null = null
  let inputArg: string | undefined

  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--json') continue
    if (a === '--utc') {
      useUtc = true
      continue
    }
    if (a === '--iso') {
      useIso = true
      continue
    }
    if (a === '--timezone') {
      timezone = args[i + 1] ?? null
      if (timezone) {
        try {
          Intl.DateTimeFormat(undefined, { timeZone: timezone })
        } catch {
          exitWithError(`unknown timezone "${timezone}"`)
        }
      }
      i++ // skip the value
      continue
    }
    if (a === '-h' || a === '--help') continue
    // First non-flag arg is the input
    if (inputArg === undefined) inputArg = a
  }

  const rawInput = inputArg ?? readStdinSync() ?? ''
  const input = rawInput.trim() || 'now'

  // Parse the input
  const date = parseDateInput(input)
  if (!date) {
    exitWithError(`unable to parse "${input}" — expected a Unix timestamp or date string`)
  }
  const _date = date!

  const unixSeconds = Math.floor(_date.getTime() / 1000)

  if (jsonMode) {
    const result: Record<string, unknown> = {
      unix: unixSeconds,
      iso: _date.toISOString(),
      local: formatLocal(_date),
      utc: formatUtc(_date),
    }
    if (timezone) {
      result.timezone = timezone
      result[`tz:${timezone}`] = formatInTimezone(_date, timezone)
    }
    console.log(JSON.stringify(result))
    return
  }

  // Output
  console.log('')
  console.log(`  ${chalk.bold('📅 Timestamp:')} ${chalk.green(String(unixSeconds))}`)
  console.log(`  ${chalk.dim('─────────────────────')}`)

  if (useIso) {
    console.log(`  ${chalk.dim('ISO:')}      ${chalk.white(_date.toISOString())}`)
  } else if (useUtc) {
    console.log(`  ${chalk.dim('UTC:')}      ${chalk.white(formatUtc(_date))}`)
  } else if (timezone) {
    console.log(`  ${chalk.dim('Local:')}    ${chalk.white(formatLocal(_date))}`)
    console.log(`  ${chalk.dim('UTC:')}      ${chalk.white(formatUtc(_date))}`)
    console.log(`  ${chalk.dim(`${timezone}:`)}  ${chalk.white(formatInTimezone(_date, timezone))}`)
  } else {
    console.log(`  ${chalk.dim('Local:')}    ${chalk.white(formatLocal(_date))}`)
    console.log(`  ${chalk.dim('UTC:')}      ${chalk.white(formatUtc(_date))}`)
  }
  console.log('')
}

export function timestampHelp() {
  console.log(chalk.bold('\n  timestamp / ts — Convert between Unix timestamps and dates'))
  console.log(`  ${chalk.dim('──────────')}`)
  console.log('')
  console.log(`  ${chalk.yellow('Usage:')}`)
  console.log('    dt ts <value>')
  console.log('    echo <value> | dt ts')
  console.log('')
  console.log(`  ${chalk.yellow('Options:')}`)
  console.log('    --utc                Show time in UTC')
  console.log('    --iso                Show time in ISO 8601 format')
  console.log('    --timezone <zone>    Show time in a specific IANA timezone')
  console.log('')
  console.log(`  ${chalk.yellow('Examples:')}`)
  console.log('    dt ts                           Current timestamp')
  console.log('    dt ts now                       Current timestamp')
  console.log('    dt ts 1716806400                Timestamp → date')
  console.log('    dt ts "2026-05-28"              Date → timestamp')
  console.log('    dt ts 1716806400 --utc           UTC time')
  console.log('    dt ts now --timezone Asia/Shanghai')
  console.log('    echo 1716806400 | dt ts          Pipe input')
  console.log('')
}

export const timestampCommand: Command = {
  name: 'timestamp',
  aliases: ['ts'],
  description: 'Convert between Unix timestamps and dates',
  run: timestamp,
  help: timestampHelp,
}
