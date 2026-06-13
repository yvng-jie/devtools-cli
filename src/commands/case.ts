import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { readStdinSync } from '../utils.js'
import { exitWithError } from '../errors.js'
import { createHelp } from '../help-builder.js'
import { parseCommonFlags } from '../parse-flags.js'
import { ask, isBack, pauseWithCopy, captureOutput } from '../interactive-utils.js'
import type { Command } from './types.js'

const FORMATS = ['camel', 'pascal', 'snake', 'kebab', 'upper', 'lower', 'title'] as const
export type Format = (typeof FORMATS)[number]

function splitWords(input: string): string[] {
  const segments = input.split(/[^a-zA-Z0-9]+/).filter(Boolean)
  const words: string[] = []
  for (const seg of segments) {
    const parts = seg.replace(/([a-z\d])([A-Z])/g, '$1\0$2').split('\0').filter(Boolean)
    words.push(...parts)
  }
  return words.map((w) => w.toLowerCase())
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

function convertTo(words: string[], format: Format): string {
  switch (format) {
    case 'camel':
      return words[0] + words.slice(1).map(capitalize).join('')
    case 'pascal':
      return words.map(capitalize).join('')
    case 'snake':
      return words.join('_')
    case 'kebab':
      return words.join('-')
    case 'upper':
      return words.join('_').toUpperCase()
    case 'lower':
      return words.join('_').toLowerCase()
    case 'title':
      return words.map(capitalize).join(' ')
  }
}

function allFormats(words: string[]): Record<Format, string> {
  const result = {} as Record<Format, string>
  for (const f of FORMATS) {
    result[f] = convertTo(words, f)
  }
  return result
}

function parseFlags(args: string[]): {
  json: boolean
  to: Format | null
  input: string
} {
  const { flags, rest } = parseCommonFlags(args)
  let to: Format | null = null
  const positional: string[] = []

  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--to') {
      const raw = rest[i + 1]
      if (raw && FORMATS.includes(raw as Format)) {
        to = raw as Format
        i++
      } else {
        exitWithError(`unsupported format "${raw}" (supported: ${FORMATS.join(', ')})`)
      }
    } else {
      positional.push(rest[i])
    }
  }

  const input = positional.join(' ') || readStdinSync()

  return { json: flags.json, to, input }
}

export function caseCommand(args: string[]) {
  const { json: jsonMode, to, input } = parseFlags(args)

  if (!input) {
    exitWithError('no input provided')
  }

  const words = splitWords(input)

  if (jsonMode) {
    console.log(JSON.stringify({ input, ...allFormats(words) }))
    return
  }

  if (to) {
    console.log(convertTo(words, to))
    return
  }

  console.log('')
  console.log(`  ${chalk.bold('Input:')}    ${chalk.white(input)}`)
  console.log('')
  for (const f of FORMATS) {
    const label = f.padEnd(8)
    const value = convertTo(words, f)
    console.log(`  ${chalk.green(label)} ${chalk.white(value)}`)
  }
  console.log('')
}

const cmdHelp = createHelp({
  name: 'case',
  description: 'Convert strings between different casing formats',
  usage: 'dt case <text> [options]',
  options: [
    { flags: '--to <format>', desc: 'Output format (camel, pascal, snake, kebab, upper, lower, title)' },
    { flags: '--json', desc: 'Show all formats as JSON' },
  ],
  extra: [
    `  ${chalk.yellow('Supported formats:')}`,
    '    camel   camelCase',
    '    pascal  PascalCase',
    '    snake   snake_case',
    '    kebab   kebab-case',
    '    upper   UPPER_CASE (screaming snake)',
    '    lower   lower_case',
    '    title   Title Case',
    '',
  ],
  examples: [
    { cmd: 'dt case "helloWorld" --to snake', desc: 'camelCase → snake_case' },
    { cmd: 'dt case "hello_world" --to pascal', desc: 'snake_case → PascalCase' },
    { cmd: 'dt case "hello-world" --to camel', desc: 'kebab-case → camelCase' },
    { cmd: 'dt case "hello" --to upper', desc: '→ HELLO (SCREAMING_SNAKE_CASE)' },
    { cmd: 'dt case "helloWorld" --json', desc: 'Show all formats as JSON' },
    { cmd: 'echo "hello-world" | dt case --to camel', desc: 'Pipe support' },
  ],
})

async function caseInteractive(rl: ReturnType<typeof createInterface>): Promise<void> {
  const input = await ask(rl, `  ${chalk.yellow('?')} String to convert: `)
  if (isBack(input)) return
  const toRaw = (
    await ask(
      rl,
      `  ${chalk.yellow('?')} Target format ${chalk.dim('(camel/pascal/snake/kebab/upper/lower/title)')} ${chalk.dim('[snake]')}: `,
    )
  ).trim()
  if (isBack(toRaw)) return
  const args = input ? [input] : []
  if (toRaw && FORMATS.includes(toRaw as Format)) {
    args.push('--to', toRaw)
  }
  const output = captureOutput(() => caseCommand(args))
  await pauseWithCopy(rl, output)
}

export const caseCmd: Command = {
  name: 'case',
  aliases: [],
  category: 'data',
  description: 'Convert strings between different casing formats',
  run: caseCommand,
  help: cmdHelp,
  interactive: caseInteractive,
}
