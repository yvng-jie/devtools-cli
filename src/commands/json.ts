import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { readStdinSync } from '../utils.js'
import { exitWithError } from '../errors.js'
import { createHelp } from '../help-builder.js'
import { parseCommonFlags } from '../parse-flags.js'
import { ask, isBack, pauseWithCopy, captureOutput } from '../interactive-utils.js'
import type { Command } from './types.js'

function highlightJson(value: unknown, indent = 2, depth = 0): string {
  const pad = ' '.repeat(indent * depth)
  if (value === null) return chalk.magenta('null')
  if (typeof value === 'boolean') return chalk.magenta(String(value))
  if (typeof value === 'number') return chalk.yellow(String(value))
  if (typeof value === 'string') {
    const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\t/g, '\\t')
    return chalk.green(`"${escaped}"`)
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const items = value.map((item) => `${pad}  ${highlightJson(item, indent, depth + 1)}`)
    return `[\n${items.join(',\n')}\n${pad}]`
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>)
    if (keys.length === 0) return '{}'
    const entries = keys.map((key) => {
      const k = chalk.cyan(`"${key}"`)
      const v = highlightJson((value as Record<string, unknown>)[key], indent, depth + 1)
      return `${pad}  ${k}: ${v}`
    })
    return `{\n${entries.join(',\n')}\n${pad}}`
  }
  return String(value)
}

function queryPath(data: unknown, path: string): unknown {
  // Parse path: a.b.c, items[0], users[0].name
  const parts = path.split(/\./).flatMap((part) => {
    const bracketMatch = part.match(/^(\w+)?\[(\d+|\*)\]/)
    if (bracketMatch) {
      const key = bracketMatch[1]
      const index = bracketMatch[2]
      const result: string[] = []
      if (key) result.push(key)
      result.push(`[${index}]`)
      return result
    }
    return [part]
  })

  let current: unknown = data
  for (const part of parts) {
    if (current === null || current === undefined) return null

    const bracketMatch = part.match(/^\[(\d+|\*)\]$/)
    if (bracketMatch) {
      if (!Array.isArray(current)) return null
      const idx = bracketMatch[1]
      if (idx === '*') {
        // Wildcard: return array of values
        current = current.map((item) => item)
        continue
      }
      const numIdx = Number(idx)
      if (numIdx < 0 || numIdx >= current.length) return null
      current = current[numIdx]
    } else if (typeof current === 'object' && current !== null) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return null
    }
  }
  return current
}

export function json(args: string[]) {
  const { rest } = parseCommonFlags(args)
  const minify = rest.includes('--minify') || rest.includes('-m')
  const validateOnly = rest.includes('--validate')
  const doQuery = rest.includes('query')
  const filteredArgs = rest.filter((a) => a !== '--minify' && a !== '-m' && a !== '--validate' && a !== 'query')

  if (doQuery) {
    // json query <json> <path> OR pipe json and pass path
    const jsonStr = filteredArgs[0] || readStdinSync()
    const path = filteredArgs[1]

    if (!jsonStr) exitWithError('provide JSON string for query')
    if (!path) exitWithError('provide a query path (e.g. "a.b.c" or "items[0]")')

    try {
      const parsed = JSON.parse(jsonStr)
      const result = queryPath(parsed, path)

      if (rest.includes('--json')) {
        console.log(JSON.stringify({ query: path, result }))
      } else {
        console.log(JSON.stringify(result))
      }
    } catch {
      exitWithError('invalid JSON')
    }
    return
  }

  const input = filteredArgs.join(' ') || readStdinSync()

  if (!input) {
    exitWithError('no input provided')
  }

  try {
    const parsed = JSON.parse(input)

    if (validateOnly) {
      console.log(chalk.green('✓ Valid JSON'))
      return
    }

    if (minify) {
      console.log(JSON.stringify(parsed))
    } else {
      console.log(highlightJson(parsed))
    }
  } catch {
    if (validateOnly) {
      exitWithError('invalid JSON')
    } else {
      exitWithError('invalid JSON — use --validate to check without formatting')
    }
  }
}

const jsonHelp = createHelp({
  name: 'json',
  description: 'Format, validate, highlight, and query JSON',
  usage: 'dt json <text> [options]',
  options: [
    { flags: '--minify, -m', desc: 'Minify JSON (single line, no whitespace)' },
    { flags: '--validate', desc: 'Validate JSON only (exit code 0/1)' },
    { flags: 'query <json> <path>', desc: 'Query JSON using dot notation (e.g. a.b.c, items[0])' },
  ],
  examples: [
    { cmd: 'dt json \'{"a":1}\'' },
    { cmd: 'echo \'{"a":1}\' | dt json' },
    { cmd: 'dt json \'{"a":1}\' --minify' },
    { cmd: 'dt json "invalid" --validate' },
    { cmd: 'dt json query \'{"a":{"b":1}}\' "a.b"' },
    { cmd: 'dt json query \'{"users":[{"n":"Alice"}]}\' "users[0].n"' },
  ],
})

async function jsonInteractive(rl: ReturnType<typeof createInterface>): Promise<void> {
  const input = await ask(rl, `  ${chalk.yellow('?')} JSON string (or paste): `)
  if (isBack(input)) return
  const minify = (await ask(rl, `  ${chalk.yellow('?')} Minify? ${chalk.dim('(y/N)')}: `)).trim().toLowerCase() === 'y'
  const output = captureOutput(() => json(input ? (minify ? [input, '--minify'] : [input]) : []))
  await pauseWithCopy(rl, output)
}

export const jsonCommand: Command = {
  name: 'json',
  aliases: [],
  category: 'data',
  description: 'Format, validate, highlight, and query JSON',
  run: json,
  help: jsonHelp,
  interactive: jsonInteractive,
}
