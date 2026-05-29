import chalk from 'chalk'
import { exitWithError } from '../errors.js'
import { readStdinSync } from '../utils.js'

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

export function timestamp(args: string[]) {
  if (args[0] === '--help' || args[0] === '-h') {
    timestampHelp()
    return
  }

  const jsonMode = args.includes('--json')
  const filteredArgs = args.filter((a) => a !== '--json')

  // Extract flags
  const useUtc = filteredArgs.includes('--utc')
  const useIso = filteredArgs.includes('--iso')

  // Get input: first non-flag arg, or pipe, or default to "now"
  const inputArg = filteredArgs.find((a) => a !== '--utc' && a !== '--iso' && a !== '-h' && a !== '--help')
  const rawInput = inputArg ?? readStdinSync() ?? ''
  const input = rawInput.trim() || 'now'

  // Parse the input
  const date = parseDateInput(input)
  if (!date) {
    exitWithError(`unable to parse "${input}" — expected a Unix timestamp or date string`)
  }

  const unixSeconds = Math.floor(date.getTime() / 1000)

  if (jsonMode) {
    console.log(
      JSON.stringify({
        unix: unixSeconds,
        iso: date.toISOString(),
        local: formatLocal(date),
        utc: formatUtc(date),
      }),
    )
    return
  }

  // Output
  console.log('')
  console.log(`  ${chalk.bold('📅 Timestamp:')} ${chalk.green(String(unixSeconds))}`)
  console.log(`  ${chalk.dim('─────────────────────')}`)

  if (useIso) {
    console.log(`  ${chalk.dim('ISO:')}      ${chalk.white(date.toISOString())}`)
  } else if (useUtc) {
    console.log(`  ${chalk.dim('UTC:')}      ${chalk.white(formatUtc(date))}`)
  } else {
    console.log(`  ${chalk.dim('Local:')}    ${chalk.white(formatLocal(date))}`)
    console.log(`  ${chalk.dim('UTC:')}      ${chalk.white(formatUtc(date))}`)
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
  console.log('    --utc         Show time in UTC')
  console.log('    --iso         Show time in ISO 8601 format')
  console.log('')
  console.log(`  ${chalk.yellow('Examples:')}`)
  console.log('    dt ts                   Current timestamp')
  console.log('    dt ts now               Current timestamp')
  console.log('    dt ts 1716806400        Timestamp → date')
  console.log('    dt ts "2026-05-28"      Date → timestamp')
  console.log('    dt ts 1716806400 --utc  UTC time')
  console.log('    echo 1716806400 | dt ts Pipe input')
  console.log('')
}
