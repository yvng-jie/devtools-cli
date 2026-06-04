import QRCode from 'qrcode'
import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { readStdinSync } from '../utils.js'
import { exitWithError, exitWithUsage } from '../errors.js'
import { createHelp } from '../help-builder.js'
import { parseCommonFlags } from '../parse-flags.js'
import { ask, isBack, pauseWithCopy, captureOutputAsync } from '../interactive-utils.js'
import type { Command } from './types.js'

function renderQr(matrix: { data: Uint8Array; size: number }): string {
  const { data, size } = matrix
  const lines: string[] = []

  for (let y = 0; y < size; y += 2) {
    let line = ''
    for (let x = 0; x < size; x++) {
      const top = data[y * size + x] !== 0
      const bottom = y + 1 < size ? data[(y + 1) * size + x] !== 0 : false

      if (top && bottom) line += '█'
      else if (top && !bottom) line += '▀'
      else if (!top && bottom) line += '▄'
      else line += ' '
    }
    lines.push(line)
  }
  return lines.join('\n')
}

export async function qrcode(args: string[]) {
  const { flags, rest } = parseCommonFlags(args)

  const input = rest.join(' ') || readStdinSync()

  if (!input) {
    exitWithUsage('provide text to encode', 'dt qrcode <text>')
  }

  try {
    const result = QRCode.create(input, { errorCorrectionLevel: 'M' })
    const rendered = renderQr(result.modules)

    if (flags.json) {
      console.log(JSON.stringify({ input, size: result.modules.size, version: result.version, errorCorrection: 'M' }))
      return
    }

    console.log('')
    console.log(rendered)
    console.log('')
    console.log(`  ${chalk.dim('Scanned data:')} ${chalk.white(input)}`)
    console.log(`  ${chalk.dim('Version:')}     ${chalk.white(String(result.version))}`)
    console.log(`  ${chalk.dim('Size:')}        ${chalk.white(`${result.modules.size}×${result.modules.size}`)}`)
    console.log('')
  } catch {
    exitWithError('failed to generate QR code')
  }
}

const qrcodeHelp = createHelp({
  name: 'qrcode',
  description: 'Generate QR codes in the terminal',
  usage: 'dt qrcode <text>',
  examples: [{ cmd: 'dt qrcode "https://example.com"' }, { cmd: 'echo "hello" | dt qrcode' }],
})

async function qrcodeInteractive(rl: ReturnType<typeof createInterface>): Promise<void> {
  const input = await ask(rl, `  ${chalk.yellow('?')} Text to encode in QR code: `)
  if (isBack(input)) return
  const output = await captureOutputAsync(() => qrcode(input ? [input] : []))
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
