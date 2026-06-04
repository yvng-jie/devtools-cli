import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { exitWithError } from '../errors.js'
import { readStdinSync } from '../utils.js'
import { createHelp } from '../help-builder.js'
import { parseCommonFlags } from '../parse-flags.js'
import { ask, isBack, pauseWithCopy, captureOutput } from '../interactive-utils.js'
import type { Command } from './types.js'

function formatLocal(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function formatUtc(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

function parseDateInput(input: string): Date | null {
  const trimmed = input.trim()
  if (trimmed.toLowerCase() === 'now') return new Date()
  if (/^\d+$/.test(trimmed)) {
    const d = new Date(Number(trimmed) * 1000)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const d = new Date(trimmed)
  return Number.isNaN(d.getTime()) ? null : d
}

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
  const { flags, rest } = parseCommonFlags(args)

  let useUtc = false
  let useIso = false
  let timezone: string | null = null
  let inputArg: string | undefined

  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]
    if (a === '--utc') {
      useUtc = true
      continue
    }
    if (a === '--iso') {
      useIso = true
      continue
    }
    if (a === '--timezone') {
      timezone = rest[i + 1] ?? null
      if (timezone) {
        try {
          Intl.DateTimeFormat(undefined, { timeZone: timezone })
        } catch {
          exitWithError(`unknown timezone "${timezone}"`)
        }
      }
      i++
      continue
    }
    if (inputArg === undefined) inputArg = a
  }

  const rawInput = inputArg ?? readStdinSync() ?? ''
  const input = rawInput.trim() || 'now'

  const date = parseDateInput(input)
  if (!date) {
    exitWithError(`unable to parse "${input}" — expected a Unix timestamp or date string`)
  }
  const _date = date!
  const unixSeconds = Math.floor(_date.getTime() / 1000)

  if (flags.json) {
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

const timestampHelp = createHelp({
  name: 'timestamp / ts',
  description: 'Convert between Unix timestamps and dates',
  usage: 'dt ts <value>',
  options: [
    { flags: '--utc', desc: 'Show time in UTC' },
    { flags: '--iso', desc: 'Show time in ISO 8601 format' },
    { flags: '--timezone <zone>', desc: 'Show time in a specific IANA timezone' },
  ],
  examples: [
    { cmd: 'dt ts', desc: 'Current timestamp' },
    { cmd: 'dt ts 1716806400', desc: 'Timestamp → date' },
    { cmd: 'dt ts "2026-05-28"', desc: 'Date → timestamp' },
    { cmd: 'dt ts now --timezone Asia/Shanghai' },
  ],
})

async function timestampInteractive(rl: ReturnType<typeof createInterface>): Promise<void> {
  const input = await ask(
    rl,
    `  ${chalk.yellow('?')} Value ${chalk.dim('(timestamp, date string, or "now")')} ${chalk.dim('[now]')}: `,
  )
  if (isBack(input)) return
  const output = captureOutput(() => timestamp(input ? [input] : []))
  await pauseWithCopy(rl, output)
}

export const timestampCommand: Command = {
  name: 'timestamp',
  aliases: ['ts'],
  category: 'utility',
  description: 'Convert between Unix timestamps and dates',
  run: timestamp,
  help: timestampHelp,
  interactive: timestampInteractive,
}
