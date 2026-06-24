import { createHmac, timingSafeEqual } from 'node:crypto'
import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { exitWithError } from '../errors.js'
import { createHelp } from '../help-builder.js'
import { parseCommonFlags } from '../parse-flags.js'
import { ask, isBack, pauseWithCopy, captureOutput } from '../interactive-utils.js'
import type { Command } from './types.js'

function base64urlEncode(buf: Buffer): string {
  return buf.toString('base64url')
}

function verifySignature(token: string, algo: string, secret: string): boolean {
  const algoMap: Record<string, string> = {
    HS256: 'sha256',
    HS384: 'sha384',
    HS512: 'sha512',
  }
  const hashAlgo = algoMap[algo]
  if (!hashAlgo) return false

  const lastDot = token.lastIndexOf('.')
  const signingInput = token.slice(0, lastDot)

  const expectedSig = base64urlEncode(createHmac(hashAlgo, secret).update(signingInput).digest())
  const actualSig = token.slice(lastDot + 1)

  if (expectedSig.length !== actualSig.length) return false

  return timingSafeEqual(Buffer.from(expectedSig), Buffer.from(actualSig))
}

export function jwt(args: string[]) {
  const { flags, rest } = parseCommonFlags(args)

  let verifySecret: string | null = null
  const filteredArgs: string[] = []
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--verify' || rest[i] === '-k') {
      verifySecret = rest[i + 1] ?? null
      i++
    } else {
      filteredArgs.push(rest[i])
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

    let expired: boolean | null = null
    let expiresAt: string | null = null
    if (payload.exp != null) {
      const exp = new Date(Number(payload.exp) * 1000)
      if (!Number.isNaN(exp.getTime())) {
        expired = exp < new Date()
        expiresAt = exp.toISOString()
      }
    }

    let sigValid: boolean | null = null
    if (verifySecret) {
      sigValid = verifySignature(input, header.alg, verifySecret)
    }

    if (flags.json) {
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

    if (sigValid !== null) {
      if (sigValid) {
        console.log(`  ${chalk.green.bold('✓ Signature valid')}`)
      } else {
        console.log(`  ${chalk.red.bold('✗ Signature invalid')}`)
      }
    }
    console.log('')

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

const jwtHelp = createHelp({
  name: 'jwt',
  description: 'Decode a JWT token with expiry detection',
  usage: 'dt jwt <token>',
  options: [
    { flags: '--verify, -k <secret>', desc: 'Verify HMAC signature (HS256/384/512)' },
  ],
  examples: [
    { cmd: 'dt jwt "eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiSm9obiJ9.xxx"' },
    { cmd: 'dt jwt <token> --verify mysecret' },
  ],
})

async function jwtInteractive(rl: ReturnType<typeof createInterface>): Promise<void> {
  const token = await ask(rl, `  ${chalk.yellow('?')} JWT token: `)
  if (isBack(token)) return
  const output = captureOutput(() => jwt(token ? [token] : []))
  await pauseWithCopy(rl, output)
}

export const jwtCommand: Command = {
  name: 'jwt',
  aliases: [],
  category: 'crypto',
  description: 'Decode a JWT token with expiry detection',
  run: jwt,
  help: jwtHelp,
  interactive: jwtInteractive,
}
