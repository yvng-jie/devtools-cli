import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { readStdinSync } from '../utils.js'
import { exitWithError } from '../errors.js'
import { createHelp } from '../help-builder.js'
import { parseCommonFlags } from '../parse-flags.js'
import { ask, isBack, pauseWithCopy, captureOutput } from '../interactive-utils.js'
import type { Command } from './types.js'

function parseCsv(input: string, delimiter: string): string[][] {
  const lines = input.split('\n').filter(Boolean)
  return lines.map((line) => {
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
}

function formatTable(rows: string[][], flags: { json: boolean; showStats?: string }): void {
  if (rows.length === 0) {
    exitWithError('no data rows')
  }

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
    const result: Record<string, unknown> = { headers, rows: data.length, data }
    if (flags.showStats) result.stats = flags.showStats
    console.log(JSON.stringify(result))
    return
  }

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

function getHeaderIndex(headers: string[], name: string): number {
  const idx = headers.indexOf(name)
  if (idx === -1) exitWithError(`column "${name}" not found — available: ${headers.join(', ')}`)
  return idx
}

function evalCondition(val: string, op: string, target: string): boolean {
  const numVal = Number(val)
  const numTarget = Number(target)
  const isNumeric = !Number.isNaN(numVal) && !Number.isNaN(numTarget)

  switch (op) {
    case '>': return isNumeric ? numVal > numTarget : val > target
    case '<': return isNumeric ? numVal < numTarget : val < target
    case '>=': return isNumeric ? numVal >= numTarget : val >= target
    case '<=': return isNumeric ? numVal <= numTarget : val <= target
    case '==': return val === target
    case '!=': return val !== target
    case 'contains': return val.toLowerCase().includes(target.toLowerCase())
    case 'startswith': return val.toLowerCase().startsWith(target.toLowerCase())
    default:
      exitWithError(`unsupported operator "${op}"`)
      return false
  }
}

export function csv(args: string[]) {
  const { flags, rest } = parseCommonFlags(args)

  let delimiter = ','
  let subcommand: string | null = null
  let subArgs: string[] = []
  const inputArgs: string[] = []

  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]
    if (a === '--delimiter') {
      delimiter = rest[i + 1] ?? ','
      i++
      continue
    }
    if (!subcommand && (a === 'select' || a === 'filter' || a === 'sort' || a === 'head' || a === 'stats')) {
      subcommand = a
      subArgs = rest.slice(i + 1)
      break
    }
    inputArgs.push(a)
  }

  const rawInput = inputArgs.join(' ') || readStdinSync()
  if (!rawInput) {
    exitWithError('no input provided')
  }

  const rows = parseCsv(rawInput, delimiter)
  if (rows.length < 1) {
    exitWithError('no data rows found')
  }

  const headers = rows[0]!
  const data = rows.slice(1)

  if (!subcommand) {
    // Default: format and display
    formatTable(rows, { json: flags.json })
    return
  }

  let resultRows: string[][] = []

  switch (subcommand) {
    case 'select': {
      const cols = subArgs.join(' ').split(',').map((c) => c.trim()).filter(Boolean)
      if (cols.length === 0) exitWithError('provide column names to select (e.g. select "name,age")')
      const indices = cols.map((c) => getHeaderIndex(headers, c))
      const newHeaders = indices.map((i) => headers[i]!)
      const newData = data.map((row) => indices.map((i) => row[i] ?? ''))
      resultRows = [newHeaders, ...newData]
      break
    }

    case 'filter': {
      const condition = subArgs.join(' ')
      if (!condition) exitWithError('provide a filter condition (e.g. filter "age > 30")')
      // Parse: column operator value
      const filterMatch = condition.match(/^(\w+)\s*(>|<|>=|<=|==|!=|contains|startswith)\s*(.+)$/)
      if (!filterMatch) {
        exitWithError('invalid filter — use format: column op value (e.g. "age > 30")')
      }
      const colName = filterMatch![1]!
      const op = filterMatch![2]!
      let target = filterMatch![3]!.trim()
      // Strip quotes
      if ((target.startsWith('"') && target.endsWith('"')) || (target.startsWith("'") && target.endsWith("'"))) {
        target = target.slice(1, -1)
      }
      const colIdx = getHeaderIndex(headers, colName)

      const filtered = data.filter((row) => {
        const val = row[colIdx] ?? ''
        return evalCondition(val, op, target)
      })
      resultRows = [headers, ...filtered]
      break
    }

    case 'sort': {
      const sortCol = subArgs[0]
      if (!sortCol) exitWithError('provide a column name to sort by')
      const desc = subArgs.includes('--desc')
      const colIdx = getHeaderIndex(headers, sortCol)

      const sorted = [...data].sort((a, b) => {
        const va = a[colIdx] ?? ''
        const vb = b[colIdx] ?? ''
        const na = Number(va), nb = Number(vb)
        if (!Number.isNaN(na) && !Number.isNaN(nb)) {
          return desc ? nb - na : na - nb
        }
        return desc ? vb.localeCompare(va) : va.localeCompare(vb)
      })
      resultRows = [headers, ...sorted]
      break
    }

    case 'head': {
      const n = Math.max(1, Math.min(data.length, Number(subArgs[0]) || 10))
      resultRows = [headers, ...data.slice(0, n)]
      break
    }

    case 'stats': {
      const numericCols = headers.map((h, i) => {
        const vals = data.map((r) => Number(r[i])).filter((v) => !Number.isNaN(v))
        if (vals.length === 0) return null
        return {
          column: h,
          count: vals.length,
          unique: new Set(vals).size,
          min: Math.min(...vals),
          max: Math.max(...vals),
          mean: vals.reduce((a, b) => a + b, 0) / vals.length,
          sum: vals.reduce((a, b) => a + b, 0),
        }
      }).filter(Boolean) as { column: string; count: number; unique: number; min: number; max: number; mean: number; sum: number }[]

      if (flags.json) {
        console.log(JSON.stringify({ columns: numericCols }))
        return
      }

      console.log('')
      console.log(`  ${chalk.bold('Column Statistics')}`)
      console.log(`  ${chalk.dim('─────────────────')}`)
      for (const col of numericCols) {
        console.log(`  ${chalk.cyan(col.column)}`)
        console.log(`    ${chalk.dim('Count:')}  ${chalk.white(String(col.count))}`)
        console.log(`    ${chalk.dim('Min:')}    ${chalk.white(String(col.min))}`)
        console.log(`    ${chalk.dim('Max:')}    ${chalk.white(String(col.max))}`)
        console.log(`    ${chalk.dim('Mean:')}   ${chalk.white(col.mean.toFixed(2))}`)
        console.log(`    ${chalk.dim('Sum:')}    ${chalk.white(String(col.sum))}`)
        console.log(`    ${chalk.dim('Unique:')} ${chalk.white(String(col.unique))}`)
      }
      console.log('')
      return
    }

    default:
      exitWithError(`unsupported subcommand "${subcommand}"`)
  }

  formatTable(resultRows, { json: flags.json })
}

const csvHelp = createHelp({
  name: 'csv',
  description: 'Format, query, and analyze CSV data',
  usage: 'dt csv [select|filter|sort|head|stats] [args]',
  options: [
    { flags: '--delimiter <char>', desc: 'Field delimiter (default: comma)' },
    { flags: 'select <cols>', desc: 'Select specific columns (e.g. select "name,age")' },
    { flags: 'filter <condition>', desc: 'Filter rows (e.g. filter "age > 30")' },
    { flags: 'sort <col>', desc: 'Sort by column (add --desc for descending)' },
    { flags: 'head <n>', desc: 'Show first N rows (default: 10)' },
    { flags: 'stats', desc: 'Show column statistics' },
  ],
  examples: [
    { cmd: 'echo "a,b,c\\n1,2,3" | dt csv' },
    { cmd: 'dt csv "name,age\\nAlice,30" select "name"' },
    { cmd: 'dt csv "name,age\\nAlice,30\\nBob,25" filter "age >= 25"' },
    { cmd: 'dt csv "name,age\\nAlice,30\\nBob,25" sort "name"' },
    { cmd: 'dt csv "name,age\\nAlice,30\\nBob,25" stats' },
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
  description: 'Format, query, and analyze CSV data',
  run: csv,
  help: csvHelp,
  interactive: csvInteractive,
}
