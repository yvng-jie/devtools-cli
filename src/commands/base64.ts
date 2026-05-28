import chalk from 'chalk'
import { readStdinSync } from '../utils.js'
import { exitWithError, exitWithUsage } from '../errors.js'

export function base64(args: string[]) {
  const action = args[0]

  if (action === '--help' || action === '-h') {
    base64Help()
    return
  }

  if (action !== 'encode' && action !== 'decode') {
    exitWithUsage('must specify "encode" or "decode"', 'dt base64 <encode|decode> <text>')
  }

  const input = args.slice(1).join(' ') || readStdinSync()

  if (!input) {
    exitWithError('no input provided')
  }

  if (action === 'decode') {
    // Validate base64 characters before decoding
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
    if (!base64Regex.test(input.trim())) {
      exitWithError('input contains invalid Base64 characters')
    }
  }

  try {
    if (action === 'encode') {
      console.log(Buffer.from(input, 'utf-8').toString('base64'))
    } else {
      console.log(Buffer.from(input, 'base64').toString('utf-8'))
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
  console.log(`  ${chalk.yellow('Examples:')}`)
  console.log('    dt base64 encode "hello world"')
  console.log('    dt base64 decode "aGVsbG8gd29ybGQ="')
  console.log('    echo "hello" | dt base64 encode')
  console.log('')
}
