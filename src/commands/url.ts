import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { readStdinSync } from '../utils.js'
import { exitWithError, exitWithUsage } from '../errors.js'
import { createHelp } from '../help-builder.js'
import { parseCommonFlags } from '../parse-flags.js'
import { ask, isBack, pauseWithCopy, captureOutput } from '../interactive-utils.js'
import type { Command } from './types.js'

export function url(args: string[]) {
  const { flags, rest } = parseCommonFlags(args)

  const input = rest.join(' ') || readStdinSync()

  if (!input) {
    exitWithUsage('provide text or a URL to process', 'dt url <encode|decode|parse> <text>')
  }

  // Determine action
  const actionMatch = input.match(/^(encode|decode|parse)\b/)
  const action = actionMatch?.[1] ?? 'encode'
  const text = actionMatch ? input.slice(action.length).trim() : input

  if (!text) {
    exitWithError('no input provided for URL operation')
  }

  switch (action) {
    case 'encode': {
      const encoded = encodeURIComponent(text)
      if (flags.json) {
        console.log(JSON.stringify({ action, input: text, output: encoded }))
      } else {
        console.log(chalk.green(encoded))
      }
      break
    }
    case 'decode': {
      try {
        const decoded = decodeURIComponent(text)
        if (flags.json) {
          console.log(JSON.stringify({ action, input: text, output: decoded }))
        } else {
          console.log(chalk.green(decoded))
        }
      } catch {
        exitWithError('invalid URL-encoded input')
      }
      break
    }
    case 'parse': {
      const params = new URLSearchParams(text.startsWith('?') ? text.slice(1) : text)
      const entries = Array.from(params.entries())

      if (flags.json) {
        console.log(JSON.stringify({ action, input: text, params: Object.fromEntries(entries) }))
        return
      }

      console.log('')
      console.log(`  ${chalk.bold('URL Parameters')}`)
      console.log(`  ${chalk.dim('───────────────')}`)
      let maxKeyLen = 0
      for (const [key] of entries) {
        maxKeyLen = Math.max(maxKeyLen, key.length)
      }
      for (const [key, value] of entries) {
        console.log(`  ${chalk.cyan(key.padEnd(maxKeyLen))}  ${chalk.white('=')}  ${chalk.green(value)}`)
      }
      if (entries.length === 0) {
        console.log(`  ${chalk.dim('(no parameters found)')}`)
      }
      console.log('')
      break
    }
  }
}

const urlHelp = createHelp({
  name: 'url',
  description: 'Encode, decode, or parse URLs',
  usage: 'dt url <encode|decode|parse> <text>',
  examples: [
    { cmd: 'dt url encode "hello world"' },
    { cmd: 'dt url decode "hello%20world"' },
    { cmd: 'dt url parse "?foo=1&bar=2"' },
    { cmd: 'echo "hello world" | dt url encode' },
  ],
})

async function urlInteractive(rl: ReturnType<typeof createInterface>): Promise<void> {
  const action = (await ask(rl, `  ${chalk.yellow('?')} encode, decode, or parse? ${chalk.dim('(encode)')}: `)).trim().toLowerCase()
  if (isBack(action)) return
  const input = await ask(rl, `  ${chalk.yellow('?')} Input: `)
  if (isBack(input)) return
  const output = captureOutput(() => url(action ? [action, input] : ['encode', input]))
  await pauseWithCopy(rl, output)
}

export const urlCommand: Command = {
  name: 'url',
  aliases: [],
  category: 'encoding',
  description: 'Encode, decode, or parse URLs',
  run: url,
  help: urlHelp,
  interactive: urlInteractive,
}
