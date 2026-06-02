import chalk from 'chalk'
import { readStdinSync } from '../utils.js'
import { exitWithError, exitWithUsage } from '../errors.js'
import type { Command } from './types.js'

export function base64(args: string[]) {
  const jsonMode = args.includes('--json')
  const urlMode = args.includes('--url')
  const filteredArgs = args.filter((a) => a !== '--json' && a !== '--url')
  const action = filteredArgs[0]

  if (action !== 'encode' && action !== 'decode') {
    exitWithUsage('must specify "encode" or "decode"', 'dt base64 <encode|decode> <text>')
  }

  const input = filteredArgs.slice(1).join(' ') || readStdinSync()

  if (!input) {
    exitWithError('no input provided')
  }

  if (action === 'decode') {
    // Validate base64 characters before decoding (accept both standard and URL-safe)
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
      // Normalize URL-safe base64 back to standard for decoding
      const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
      raw = Buffer.from(normalized, 'base64').toString('utf-8')
    }

    const output = urlMode && action === 'encode' ? raw.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : raw

    if (jsonMode) {
      const flags: Record<string, boolean> = {}
      if (urlMode) flags.url = true
      console.log(JSON.stringify({ action, input, output, ...flags }))
    } else {
      console.log(output)
    }
  } catch {
    exitWithError('invalid Base64 input')
  }
}

function base64Help() {
  console.log(chalk.bold('\n  base64 — Encode or decode Base64'))
  console.log(`  ${chalk.dim('──────')}`)
  console.log('')
  console.log(`  ${chalk.yellow('Usage:')}`)
  console.log('    dt base64 <encode|decode> <text>')
  console.log('    echo <text> | dt base64 <encode|decode>')
  console.log('')
  console.log(`  ${chalk.yellow('Options:')}`)
  console.log('    --url   URL-safe base64 (no padding, + → -, / → _)')
  console.log('')
  console.log(`  ${chalk.yellow('Examples:')}`)
  console.log('    dt base64 encode "hello world"')
  console.log('    dt base64 decode "aGVsbG8gd29ybGQ="')
  console.log('    echo "hello" | dt base64 encode')
  console.log('    dt base64 encode "hello" --url')
  console.log('')
}

export const base64Command: Command = {
  name: 'base64',
  aliases: [],
  description: 'Encode or decode Base64',
  run: base64,
  help: base64Help,
}
