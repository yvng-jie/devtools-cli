import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { readStdinSync } from '../utils.js'
import { exitWithError } from '../errors.js'
import { createHelp } from '../help-builder.js'
import { parseCommonFlags } from '../parse-flags.js'
import { ask, isBack, pauseWithCopy, captureOutput } from '../interactive-utils.js'
import type { Command } from './types.js'

export function csv(args: string[]) {
  const { flags, rest } = parseCommonFlags(args)

  // Parse --delimiter flag and collect input args
  let delimiter = ','
  const inputArgs: string[] = []
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]!
    if (a === '--delimiter') {
      delimiter = rest[i + 1] ?? ','
      i++ // skip the value
      continue
    }
    inputArgs.push(a)
  }

  const input = inputArgs.join(' ') || readStdinSync()

  if (!input) {
    exitWithError('no input provided')
  }

  const lines = input.split('\n').filter(Boolean)
  if (lines.length === 0) {
    exitWithError('no data rows found')
  }

  const rows = lines.map((line) => {
    const parts: string[] = []
    let current = ''
    let inQuotes = false
    for (const ch of line) {
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === delimiter && !inQuotes) {
        parts.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    parts.push(current.trim())
    return parts
  })

  const maxCols = Math.max(...rows.map((r) => r.length))
  const colWidths = Array.from({ length: maxCols }, (_, ci) => Math.max(...rows.map((r) => (r[ci] ?? '').length), 3))

  if (flags.json) {
    const headers = rows[0] ?? []
    const data = rows.slice(1).map((row) => {
      const entry: Record<string, string> = {}
      headers.forEach((h, i) => {
        entry[h] = row[i] ?? ''
      })
      return entry
    })
    console.log(JSON.stringify({ headers, rows: data.length, data }))
    return
  }

  // Render as formatted table
  const formatRow = (row: string[], isHeader: boolean) => {
    const cells = row.map((cell, i) => {
      const val = cell.padEnd(colWidths[i] ?? 3)
      return isHeader ? chalk.cyan(val) : chalk.white(val)
    })
    return `  ${cells.join(` ${chalk.dim('│')} `)}`
  }

  const separator = `  ${colWidths.map((w) => '─'.repeat(w)).join(` ${chalk.dim('┼')} `)}`

  console.log('')
  console.log(formatRow(rows[0]!, true))
  console.log(separator)
  for (let i = 1; i < rows.length; i++) {
    console.log(formatRow(rows[i]!, false))
  }
  console.log('')
}

const csvHelp = createHelp({
  name: 'csv',
  description: 'Format and view CSV data',
  usage: 'dt csv <csv-string>',
  options: [{ flags: '--delimiter <char>', desc: 'Field delimiter (default: comma)' }],
  examples: [
    { cmd: 'echo "a,b,c\\n1,2,3" | dt csv' },
    { cmd: 'dt csv "name,age\\nAlice,30"' },
    { cmd: "cat data.tsv | dt csv --delimiter $'\\t'" },
  ],
})

async function csvInteractive(rl: ReturnType<typeof createInterface>): Promise<void> {
  const input = await ask(rl, `  ${chalk.yellow('?')} CSV data (or paste): `)
  if (isBack(input)) return
  const output = captureOutput(() => csv(input ? [input] : []))
  await pauseWithCopy(rl, output)
}

export const csvCommand: Command = {
  name: 'csv',
  aliases: [],
  category: 'data',
  description: 'Format and view CSV data',
  run: csv,
  help: csvHelp,
  interactive: csvInteractive,
}
