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

export function json(args: string[]) {
  const { flags, rest } = parseCommonFlags(args)
  const minify = rest.includes('--minify') || rest.includes('-m')
  const validateOnly = rest.includes('--validate')
  const filteredArgs = rest.filter((a) => a !== '--minify' && a !== '-m' && a !== '--validate')

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
  description: 'Format, validate, and highlight JSON',
  usage: 'dt json <text>',
  options: [
    { flags: '--minify, -m', desc: 'Minify JSON (single line, no whitespace)' },
    { flags: '--validate', desc: 'Validate JSON only (exit code 0/1)' },
  ],
  examples: [
    { cmd: 'dt json \'{"a":1}\'' },
    { cmd: 'echo \'{"a":1}\' | dt json' },
    { cmd: 'dt json \'{"a":1}\' --minify' },
    { cmd: 'dt json "invalid" --validate' },
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
  description: 'Format, validate, and highlight JSON',
  run: json,
  help: jsonHelp,
  interactive: jsonInteractive,
}
