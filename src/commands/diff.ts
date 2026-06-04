import { readFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { readStdinSync } from '../utils.js'
import { exitWithError } from '../errors.js'
import { createHelp } from '../help-builder.js'
import { parseCommonFlags } from '../parse-flags.js'
import { ask, isBack, pauseWithCopy, captureOutput } from '../interactive-utils.js'
import type { Command } from './types.js'

/** Simple character-level diff. Returns two strings with ANSI color codes. */
function charDiff(a: string, b: string): [string, string] {
  const maxLen = Math.max(a.length, b.length)
  let outA = ''
  let outB = ''

  for (let i = 0; i < maxLen; i++) {
    const ca = a[i] ?? ''
    const cb = b[i] ?? ''

    if (ca === cb) {
      outA += ca
      outB += cb
    } else {
      outA += chalk.red(ca)
      outB += chalk.green(cb)
    }
  }

  return [outA, outB]
}

/** Simple line-level diff. Returns colored lines. */
function lineDiff(a: string, b: string): string[] {
  const linesA = a.split('\n')
  const linesB = b.split('\n')
  const result: string[] = []

  const maxLen = Math.max(linesA.length, linesB.length)
  for (let i = 0; i < maxLen; i++) {
    const la = linesA[i] ?? ''
    const lb = linesB[i] ?? ''

    if (la === lb) {
      result.push(`  ${la}`)
    } else {
      if (la) result.push(chalk.red(`- ${la}`))
      if (lb) result.push(chalk.green(`+ ${lb}`))
    }
  }

  return result
}

export function diff(args: string[]) {
  const { flags, rest } = parseCommonFlags(args)

  // Parse flags and collect input args
  let fileMode = false
  let fileA: string | undefined
  let fileB: string | undefined
  const inputArgs: string[] = []
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]
    if (a === '--file') {
      fileMode = true
      fileA = rest[i + 1]
      fileB = rest[i + 2]
      i += 2 // skip the two file paths
      continue
    }
    inputArgs.push(a)
  }

  let textA = ''
  let textB = ''

  if (fileMode) {
    if (!fileA || !fileB) {
      exitWithError('--file requires two file paths: dt diff --file <file-a> <file-b>')
    }
    try {
      textA = readFileSync(fileA!, 'utf-8')
      textB = readFileSync(fileB!, 'utf-8')
    } catch {
      exitWithError('failed to read files for diff')
    }
  } else {
    const pipe = readStdinSync()
    if (pipe) {
      textA = pipe
      textB = inputArgs.join(' ')
    } else {
      textA = inputArgs[0] ?? ''
      textB = inputArgs.slice(1).join(' ') || readStdinSync()
    }
  }

  if (!textB) {
    exitWithError('provide two strings to compare, or pipe one and pass the other')
  }
  const _textA = textA
  const _textB = textB

  // Determine if line-level diff is more appropriate
  const multiline = _textA.includes('\n') || _textB.includes('\n')

  if (flags.json) {
    console.log(JSON.stringify({ a: _textA, b: _textB, multiline }))
    return
  }

  console.log('')
  console.log(`  ${chalk.bold('Diff')}`)
  console.log(`  ${chalk.dim('────')}`)

  if (multiline) {
    const lines = lineDiff(_textA, _textB)
    for (const line of lines) {
      console.log(`  ${line}`)
    }
  } else {
    const [outA, outB] = charDiff(_textA, _textB)
    console.log(`  ${chalk.red.bold('A:')} ${outA}`)
    console.log(`  ${chalk.green.bold('B:')} ${outB}`)
  }
  console.log('')
}

const diffHelp = createHelp({
  name: 'diff',
  description: 'Compare two strings or files',
  usage: 'dt diff <string-a> <string-b>',
  options: [{ flags: '--file', desc: 'Compare two files' }],
  examples: [
    { cmd: 'dt diff "abc" "abd"' },
    { cmd: 'dt diff --file old.txt new.txt' },
    { cmd: 'echo "hello" | dt diff "world"' },
  ],
})

async function diffInteractive(rl: ReturnType<typeof createInterface>): Promise<void> {
  const textA = await ask(rl, `  ${chalk.yellow('?')} First string: `)
  if (isBack(textA)) return
  const textB = await ask(rl, `  ${chalk.yellow('?')} Second string: `)
  if (isBack(textB)) return
  const output = captureOutput(() => diff(textA && textB ? [textA, textB] : []))
  await pauseWithCopy(rl, output)
}

export const diffCommand: Command = {
  name: 'diff',
  aliases: [],
  category: 'data',
  description: 'Compare two strings or files',
  run: diff,
  help: diffHelp,
  interactive: diffInteractive,
}
