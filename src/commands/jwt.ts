import chalk from 'chalk'
import { exitWithError } from '../errors.js'

export function jwt(args: string[]) {
  if (args[0] === '--help' || args[0] === '-h') {
    jwtHelp()
    return
  }

  const jsonMode = args.includes('--json')
  const filteredArgs = args.filter((a) => a !== '--json')

  const input = filteredArgs.join(' ').trim()
  if (!input) {
    exitWithError('provide a JWT token')
  }

  const parts = input.split('.')
  if (parts.length !== 3) {
    exitWithError('invalid JWT (expected header.payload.signature)')
  }

  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf-8'))
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'))

    // Compute expiry info
    let expired: boolean | null = null
    let expiresAt: string | null = null
    if (payload.exp != null) {
      const exp = new Date(Number(payload.exp) * 1000)
      if (!Number.isNaN(exp.getTime())) {
        expired = exp < new Date()
        expiresAt = exp.toISOString()
      }
    }

    if (jsonMode) {
      console.log(JSON.stringify({ header, payload, signature: parts[2], expired, expiresAt }))
      return
    }

    const headerStr = JSON.stringify(header, null, 2)
    const payloadStr = JSON.stringify(payload, null, 2)

    console.log('')
    console.log(`  ${chalk.bold.yellow('HEADER')}`)
    console.log(`  ${chalk.dim('──────')}`)
    for (const line of headerStr.split('\n')) {
      console.log(`  ${chalk.white(line)}`)
    }

    console.log('')
    console.log(`  ${chalk.bold.green('PAYLOAD')}`)
    console.log(`  ${chalk.dim('───────')}`)
    for (const line of payloadStr.split('\n')) {
      // Colorize specific JWT claims
      if (line.includes('"iat"') || line.includes('"exp"') || line.includes('"nbf"')) {
        console.log(`  ${chalk.yellow(line)}`)
      } else if (line.includes('"sub"') || line.includes('"iss"') || line.includes('"aud"')) {
        console.log(`  ${chalk.cyan(line)}`)
      } else {
        console.log(`  ${chalk.white(line)}`)
      }
    }

    console.log('')
    console.log(`  ${chalk.dim('SIGNATURE')}`)
    console.log(`  ${chalk.dim(parts[2].slice(0, 40))}...`)
    console.log('')

    // Warn if expired
    if (expired != null) {
      if (expired) {
        console.log(`  ${chalk.red.bold('⚠ EXPIRED')} ${chalk.dim(`at ${expiresAt}`)}`)
      } else {
        console.log(`  ${chalk.green('✓ Valid until')} ${chalk.dim(expiresAt)}`)
      }
      console.log('')
    }
  } catch {
    exitWithError('failed to decode JWT — parts may not be valid base64url')
  }
}

function jwtHelp() {
  console.log(chalk.bold('\n  jwt — Decode a JWT token'))
  console.log(`  ${chalk.dim('───')}`)
  console.log('')
  console.log(`  ${chalk.yellow('Usage:')}`)
  console.log('    dt jwt <token>')
  console.log('')
  console.log(`  ${chalk.yellow('Examples:')}`)
  console.log('    dt jwt "eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiSm9obiJ9.xxx"')
  console.log('')
}
