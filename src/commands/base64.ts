import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { readStdinSync } from '../utils.js'
import { exitWithError, exitWithUsage } from '../errors.js'
import { createHelp } from '../help-builder.js'
import { parseCommonFlags } from '../parse-flags.js'
import { ask, isBack, pauseWithCopy, captureOutput } from '../interactive-utils.js'
import type { Command } from './types.js'

export function base64(args: string[]) {
  const { flags, rest } = parseCommonFlags(args)
  const urlMode = rest.includes('--url')
  const filteredArgs = rest.filter((a) => a !== '--url')
  const action = filteredArgs[0]

  if (action !== 'encode' && action !== 'decode') {
    exitWithUsage('must specify "encode" or "decode"', 'dt base64 <encode|decode> <text>')
  }

  const input = filteredArgs.slice(1).join(' ') || readStdinSync()

  if (!input) {
    exitWithError('no input provided')
  }

  if (action === 'decode') {
    const base64Regex = /^[A-Za-z0-9+/_-]*={0,2}$/
    if (!base64Regex.test(input.trim())) {
      exitWithError('input contains invalid Base64 characters')
    }
  }

  try {
    let raw: string
    if (action === 'encode') {
      raw = Buffer.from(input, 'utf-8').toString('base64')
    } else {
      const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
      raw = Buffer.from(normalized, 'base64').toString('utf-8')
    }

    const output = urlMode && action === 'encode' ? raw.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : raw

    if (flags.json) {
      const extra: Record<string, boolean> = {}
      if (urlMode) extra.url = true
      console.log(JSON.stringify({ action, input, output, ...extra }))
    } else {
      console.log(output)
    }
  } catch {
    exitWithError('invalid Base64 input')
  }
}

const base64Help = createHelp({
  name: 'base64',
  description: 'Encode or decode Base64',
  usage: 'dt base64 <encode|decode> <text>',
  options: [{ flags: '--url', desc: 'URL-safe base64 (no padding, + → -, / → _)' }],
  examples: [
    { cmd: 'dt base64 encode "hello world"' },
    { cmd: 'dt base64 decode "aGVsbG8gd29ybGQ="' },
    { cmd: 'echo "hello" | dt base64 encode' },
    { cmd: 'dt base64 encode "hello" --url' },
  ],
})

async function base64Interactive(rl: ReturnType<typeof createInterface>): Promise<void> {
  const actionRaw = (await ask(rl, `  ${chalk.yellow('?')} encode or decode? ${chalk.dim('(encode)')}: `)).trim()
  if (isBack(actionRaw)) return
  const action = actionRaw || 'encode'
  const hint = action === 'decode' ? '(base64 string, e.g. aGVsbG8=)' : '(plain text, e.g. hello)'
  const input = await ask(rl, `  ${chalk.yellow('?')} Input ${hint}: `)
  if (isBack(input)) return
  const output = captureOutput(() => base64(input ? [action, input] : [action]))
  await pauseWithCopy(rl, output)
}

export const base64Command: Command = {
  name: 'base64',
  aliases: [],
  category: 'encoding',
  description: 'Encode or decode Base64',
  run: base64,
  help: base64Help,
  interactive: base64Interactive,
}
