import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { readStdinSync } from '../utils.js'
import { createHelp } from '../help-builder.js'
import { parseCommonFlags } from '../parse-flags.js'
import { ask, isBack, pauseWithCopy, captureOutput } from '../interactive-utils.js'
import type { Command } from './types.js'

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'ut', 'aliquip', 'ex', 'ea',
  'commodo', 'consequat', 'duis', 'aute', 'irure', 'dolor', 'in', 'reprehenderit',
  'in', 'voluptate', 'velit', 'esse', 'cillum', 'dolore', 'eu', 'fugiat', 'nulla',
  'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident',
  'sunt', 'in', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id',
  'est', 'laborum',
]

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function generateWords(count: number, start?: string): string {
  const words: string[] = []
  if (start) words.push(start)
  for (let i = words.length; i < count; i++) {
    words.push(LOREM_WORDS[i % LOREM_WORDS.length])
  }
  return words.join(' ')
}

function generateSentences(count: number, start?: string): string {
  const sentences: string[] = []
  let wordCount = 0
  const targetWords = count * 8

  for (let s = 0; s < count; s++) {
    const remaining = targetWords - wordCount
    const wc = Math.max(3, Math.min(12, Math.floor(remaining / (count - s) + Math.random() * 3 - 1)))
    const words: string[] = []
    for (let i = 0; i < wc; i++) {
      words.push(LOREM_WORDS[(wordCount + i) % LOREM_WORDS.length])
    }
    wordCount += wc
    const sentence = words.join(' ') + '.'
    sentences.push(s === 0 && start ? `${start} ${sentence}` : capitalize(sentence))
  }
  return sentences.join(' ')
}

function generateParagraphs(count: number, start?: string): string {
  const paras: string[] = []
  for (let p = 0; p < count; p++) {
    const sentenceCount = 3 + Math.floor(Math.random() * 4)
    if (p === 0 && start) {
      paras.push(start + ' ' + generateSentences(sentenceCount).slice(0, -1) + '.')
    } else {
      paras.push(generateSentences(sentenceCount))
    }
  }
  return paras.join('\n\n')
}

export function lorem(args: string[]) {
  const { flags, rest } = parseCommonFlags(args)

  let mode: 'paragraphs' | 'sentences' | 'words' = 'paragraphs'
  let count = 1
  let start: string | undefined

  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]
    if (a === '--paragraphs' || a === '-p') {
      mode = 'paragraphs'
      const raw = rest[i + 1]
      if (raw && /^\d+$/.test(raw)) { count = Number(raw); i++ }
    } else if (a === '--sentences' || a === '-s') {
      mode = 'sentences'
      const raw = rest[i + 1]
      if (raw && /^\d+$/.test(raw)) { count = Number(raw); i++ }
    } else if (a === '--words' || a === '-w') {
      mode = 'words'
      const raw = rest[i + 1]
      if (raw && /^\d+$/.test(raw)) { count = Number(raw); i++ }
    } else if (a === '--start') {
      start = rest[i + 1]
      i++
    }
  }

  // stdin pipe for count
  if (count === 1 && mode !== 'paragraphs') {
    const piped = readStdinSync()
    if (piped && /^\d+$/.test(piped.trim())) {
      count = Number(piped.trim())
    }
  }

  if (count < 1) count = 1
  if (count > 1000) count = 1000

  let text: string
  switch (mode) {
    case 'words':
      text = generateWords(count, start)
      break
    case 'sentences':
      text = generateSentences(count, start)
      break
    default:
      text = generateParagraphs(count, start)
  }

  if (flags.json) {
    console.log(JSON.stringify({ [mode]: count, text }))
    return
  }

  console.log('')
  console.log(text)
  console.log('')
}

const loremHelp = createHelp({
  name: 'lorem',
  description: 'Generate Lorem ipsum placeholder text',
  usage: 'dt lorem [options]',
  options: [
    { flags: '-p, --paragraphs <n>', desc: 'Number of paragraphs (default: 1)' },
    { flags: '-s, --sentences <n>', desc: 'Number of sentences' },
    { flags: '-w, --words <n>', desc: 'Number of words' },
    { flags: '--start <text>', desc: 'Custom starting text' },
  ],
  examples: [
    { cmd: 'dt lorem' },
    { cmd: 'dt lorem --paragraphs 3' },
    { cmd: 'dt lorem --sentences 5' },
    { cmd: 'dt lorem --words 20' },
    { cmd: 'dt lorem --words 10 --start "Custom start"' },
  ],
})

async function loremInteractive(rl: ReturnType<typeof createInterface>): Promise<void> {
  const mode = (await ask(rl, `  ${chalk.yellow('?')} paragraphs, sentences, or words? ${chalk.dim('(paragraphs)')}: `)).trim().toLowerCase()
  if (isBack(mode)) return
  const count = await ask(rl, `  ${chalk.yellow('?')} How many? ${chalk.dim('(1)')}: `)
  if (isBack(count)) return
  const args: string[] = []
  if (mode === 'sentences' || mode === 's') {
    args.push('--sentences', count || '1')
  } else if (mode === 'words' || mode === 'w') {
    args.push('--words', count || '1')
  } else {
    args.push('--paragraphs', count || '1')
  }
  const output = captureOutput(() => lorem(args))
  await pauseWithCopy(rl, output)
}

export const loremCommand: Command = {
  name: 'lorem',
  aliases: [],
  category: 'utility',
  description: 'Generate Lorem ipsum placeholder text',
  run: lorem,
  help: loremHelp,
  interactive: loremInteractive,
}
