import QRCode from 'qrcode'
import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { readStdinSync } from '../utils.js'
import { exitWithError, exitWithUsage } from '../errors.js'
import { createHelp } from '../help-builder.js'
import { parseCommonFlags } from '../parse-flags.js'
import { ask, isBack, pauseWithCopy, captureOutputAsync } from '../interactive-utils.js'
import type { Command } from './types.js'

const ECC_LEVELS = ['L', 'M', 'Q', 'H'] as const
type EccLevel = (typeof ECC_LEVELS)[number]

function renderQr(matrix: { data: Uint8Array; size: number }, size: number, invert: boolean): string {
  const { data: src, size: dim } = matrix
  const lines: string[] = []
  const scale = Math.max(1, Math.min(4, Math.round(size)))

  for (let y = 0; y < dim; y += 2) {
    let line = ''
    for (let x = 0; x < dim; x++) {
      const top = src[y * dim + x] !== 0
      const bottom = y + 1 < dim ? src[(y + 1) * dim + x] !== 0 : false

      let ch: string
      if (top && bottom) ch = '█'
      else if (top && !bottom) ch = '▀'
      else if (!top && bottom) ch = '▄'
      else ch = ' '

      if (invert) {
        // Swap block/space
        if (ch === ' ') ch = '█'
        else if (ch === '█') ch = ' '
        else if (ch === '▀') ch = '▄'
        else if (ch === '▄') ch = '▀'
      }

      line += scale > 1 ? ch.repeat(scale) : ch
    }
    lines.push(line)
  }
  return lines.join('\n')
}

export async function qrcode(args: string[]) {
  const { flags, rest } = parseCommonFlags(args)

  let ecc: EccLevel = 'M'
  let size = 1
  let invert = false
  const inputArgs: string[] = []
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]
    if (a === '--ecc') {
      const raw = rest[i + 1]?.toUpperCase()
      if (raw && ECC_LEVELS.includes(raw as EccLevel)) {
        ecc = raw as EccLevel
        i++
      } else {
        exitWithError(`unsupported ECC level "${rest[i + 1]}" (supported: ${ECC_LEVELS.join(', ')})`)
      }
    } else if (a === '--size') {
      const raw = Number(rest[i + 1])
      if (Number.isInteger(raw) && raw >= 1 && raw <= 4) {
        size = raw
        i++
      } else {
        exitWithError('--size must be an integer between 1 and 4')
      }
    } else if (a === '--invert') {
      invert = true
    } else {
      inputArgs.push(a)
    }
  }

  const input = inputArgs.join(' ') || readStdinSync()

  if (!input) {
    exitWithUsage('provide text to encode', 'dt qrcode <text>')
  }

  try {
    const result = QRCode.create(input, { errorCorrectionLevel: ecc })
    const rendered = renderQr(result.modules, size, invert)

    if (flags.json) {
      console.log(JSON.stringify({
        input,
        size: result.modules.size,
        version: result.version,
        errorCorrection: ecc,
        moduleSize: size,
        invert,
      }))
      return
    }

    console.log('')
    console.log(rendered)
    console.log('')
    console.log(`  ${chalk.dim('Scanned data:')} ${chalk.white(input)}`)
    console.log(`  ${chalk.dim('Version:')}     ${chalk.white(String(result.version))}`)
    console.log(`  ${chalk.dim('Size:')}        ${chalk.white(`${result.modules.size}×${result.modules.size}`)}`)
    console.log(`  ${chalk.dim('ECC:')}         ${chalk.white(ecc)}`)
    console.log('')
  } catch {
    exitWithError('failed to generate QR code')
  }
}

const qrcodeHelp = createHelp({
  name: 'qrcode',
  description: 'Generate QR codes in the terminal',
  usage: 'dt qrcode <text> [options]',
  options: [
    { flags: '--ecc <L|M|Q|H>', desc: 'Error correction level (default: M)' },
    { flags: '--size <n>', desc: 'Module size scaling 1-4 (default: 1)' },
    { flags: '--invert', desc: 'Invert colors (dark background)' },
  ],
  examples: [
    { cmd: 'dt qrcode "https://example.com"' },
    { cmd: 'dt qrcode "hello" --ecc H' },
    { cmd: 'dt qrcode "hello" --size 2' },
    { cmd: 'dt qrcode "hello" --invert' },
    { cmd: 'echo "hello" | dt qrcode' },
  ],
})

async function qrcodeInteractive(rl: ReturnType<typeof createInterface>): Promise<void> {
  const input = await ask(rl, `  ${chalk.yellow('?')} Text to encode in QR code: `)
  if (isBack(input)) return
  const ecc = (await ask(rl, `  ${chalk.yellow('?')} ECC level ${chalk.dim('(L/M/Q/H)')} ${chalk.dim('[M]')}: `)).trim().toUpperCase()
  if (isBack(ecc)) return
  const args = input ? [input] : []
  if (ecc && ECC_LEVELS.includes(ecc as EccLevel)) args.push('--ecc', ecc)
  const output = await captureOutputAsync(() => qrcode(args))
  await pauseWithCopy(rl, output)
}

export const qrcodeCommand: Command = {
  name: 'qrcode',
  aliases: ['qr'],
  category: 'utility',
  description: 'Generate QR codes in the terminal',
  run: qrcode,
  help: qrcodeHelp,
  interactive: qrcodeInteractive,
}
