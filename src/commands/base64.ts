import chalk from 'chalk'
import { readStdinSync } from '../utils.js'

export function base64(args: string[]) {
  const action = args[0]

  if (action === '--help' || action === '-h') {
    base64Help()
    return
  }

  if (action !== 'encode' && action !== 'decode') {
    console.log(chalk.red('Error: must specify "encode" or "decode"'))
    console.log(chalk.dim('  Usage: dt base64 <encode|decode> <text>'))
    console.log(chalk.dim('  Or:    echo <text> | dt base64 <encode|decode>'))
    process.exit(1)
  }

  const input = args.slice(1).join(' ') || readStdinSync()

  if (!input) {
    console.log(chalk.red('Error: no input provided'))
    process.exit(1)
  }

  try {
    if (action === 'encode') {
      console.log(Buffer.from(input, 'utf-8').toString('base64'))
    } else {
      console.log(Buffer.from(input, 'base64').toString('utf-8'))
    }
  } catch {
    console.log(chalk.red('Error: invalid Base64 input'))
    process.exit(1)
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
