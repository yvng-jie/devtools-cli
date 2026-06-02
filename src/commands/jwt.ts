import { createHmac } from 'node:crypto'
import chalk from 'chalk'
import { exitWithError } from '../errors.js'
import type { Command } from './types.js'

/** Base64url-encode a buffer (no padding). */
function base64urlEncode(buf: Buffer): string {
  return buf.toString('base64url')
}

/** Verify JWT signature given the raw token string, header algorithm, and secret. */
function verifySignature(token: string, algo: string, secret: string): boolean {
  // Map JWT algorithm to crypto algorithm name
  const algoMap: Record<string, string> = {
    HS256: 'sha256',
    HS384: 'sha384',
    HS512: 'sha512',
  }
  const hashAlgo = algoMap[algo]
  if (!hashAlgo) return false

  // The signing input is the first two parts (header.payload)
  const lastDot = token.lastIndexOf('.')
  const signingInput = token.slice(0, lastDot)

  const expectedSig = base64urlEncode(createHmac(hashAlgo, secret).update(signingInput).digest())
  const actualSig = token.slice(lastDot + 1)

  // Constant-time comparison to prevent timing attacks
  if (expectedSig.length !== actualSig.length) return false

  let result = 0
  for (let i = 0; i < expectedSig.length; i++) {
    result |= expectedSig.charCodeAt(i) ^ actualSig.charCodeAt(i)
  }
  return result === 0
}

export function jwt(args: string[]) {
  const jsonMode = args.includes('--json')

  // Parse --verify flag
  let verifySecret: string | null = null
  const filteredArgs: string[] = []
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--verify' || args[i] === '-k') {
      verifySecret = args[i + 1] ?? null
      i++ // skip the value
    } else if (args[i] !== '--json') {
      filteredArgs.push(args[i])
    }
  }

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

    // Verify signature if --verify was provided
    let sigValid: boolean | null = null
    if (verifySecret) {
      sigValid = verifySignature(input, header.alg, verifySecret)
    }

    if (jsonMode) {
      const result: Record<string, unknown> = { header, payload, signature: parts[2], expired, expiresAt }
      if (sigValid !== null) result.signatureValid = sigValid
      console.log(JSON.stringify(result))
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

    // Show verification result
    if (sigValid !== null) {
      if (sigValid) {
        console.log(`  ${chalk.green.bold('✓ Signature valid')}`)
      } else {
        console.log(`  ${chalk.red.bold('✗ Signature invalid')}`)
      }
    }
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
  console.log(`  ${chalk.yellow('Options:')}`)
  console.log('    --verify, -k <secret>   Verify HMAC signature (HS256/384/512)')
  console.log('')
  console.log(`  ${chalk.yellow('Examples:')}`)
  console.log('    dt jwt "eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiSm9obiJ9.xxx"')
  console.log('    dt jwt <token> --verify mysecret')
  console.log('')
}

export const jwtCommand: Command = {
  name: 'jwt',
  aliases: [],
  description: 'Decode a JWT token with expiry detection',
  run: jwt,
  help: jwtHelp,
}
