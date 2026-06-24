import { readFileSync, statSync } from 'node:fs'
import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { exitWithError } from '../errors.js'
import { createHelp } from '../help-builder.js'
import { parseCommonFlags } from '../parse-flags.js'
import { ask, isBack, pauseWithCopy, captureOutput } from '../interactive-utils.js'
import type { Command } from './types.js'

interface ImageInfo {
  file: string
  format: string
  sizeBytes: number
  width: number
  height: number
  aspectRatio: string
  colorMode?: string
}

const MAX_IMAGE_SIZE = 50 * 1024 * 1024

/** Read image header and extract metadata without external deps. */
function readImageInfo(filePath: string): ImageInfo | null {
  try {
    const sizeBytes = statSync(filePath).size
    if (sizeBytes > MAX_IMAGE_SIZE) return null

    const bytes = readFileSync(filePath)
    const header = bytes.subarray(0, Math.min(bytes.length, 64))
    const hex = header.toString('hex').toUpperCase()

    // PNG
    if (hex.startsWith('89504E47')) {
      if (bytes.length < 24) return null
      const width = bytes.readUInt32BE(16)
      const height = bytes.readUInt32BE(20)
      const colorType = bytes[25]
      const colorModes: Record<number, string> = {
        0: 'Grayscale',
        2: 'RGB',
        3: 'Indexed',
        4: 'Grayscale+Alpha',
        6: 'RGBA',
      }
      return {
        file: filePath,
        format: 'PNG',
        sizeBytes,
        width,
        height,
        aspectRatio: (width / height).toFixed(2),
        colorMode: colorModes[colorType] ?? 'Unknown',
      }
    }

    // JPEG
    if (hex.startsWith('FFD8FF')) {
      let offset = 2
      let iterations = 0
      while (offset < bytes.length - 1 && iterations < 100) {
        iterations++
        if (bytes[offset] !== 0xff) break
        const marker = bytes[offset + 1]
        if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
          if (offset + 9 > bytes.length) return null
          const height = bytes.readUInt16BE(offset + 5)
          const width = bytes.readUInt16BE(offset + 7)
          const precision = bytes[offset + 4]
          return {
            file: filePath,
            format: 'JPEG',
            sizeBytes,
            width,
            height,
            aspectRatio: (width / height).toFixed(2),
            colorMode: `${precision}-bit`,
          }
        }
        if (offset + 4 > bytes.length) return null
        const segLen = bytes.readUInt16BE(offset + 2)
        offset += segLen + 2
      }
      return { file: filePath, format: 'JPEG', sizeBytes, width: 0, height: 0, aspectRatio: '?' }
    }

    // GIF
    if (hex.startsWith('474946')) {
      if (bytes.length < 10) return null
      const width = bytes.readUInt16LE(6)
      const height = bytes.readUInt16LE(8)
      const version = header.subarray(3, 6).toString() === '89a' ? 'GIF89a' : 'GIF87a'
      return { file: filePath, format: version, sizeBytes, width, height, aspectRatio: (width / height).toFixed(2) }
    }

    // WebP
    if (hex.startsWith('52494646') && hex.slice(16, 24) === '57454250') {
      const vp8 = header.subarray(12).toString().includes('VP8')
      const vp8l = header.subarray(12).toString().includes('VP8L')
      const vp8x = header.subarray(12).toString().includes('VP8X')

      if (vp8x && bytes.length >= 30) {
        const w = ((bytes[27] | (bytes[28] << 8) | (bytes[29] << 16)) & 0x3fff) + 1
        const h = ((bytes[30] | (bytes[31] << 8) | (bytes[32] << 16)) & 0x3fff) + 1
        return {
          file: filePath,
          format: 'WebP (VP8X)',
          sizeBytes,
          width: w,
          height: h,
          aspectRatio: (w / h).toFixed(2),
        }
      }
      if (vp8l && bytes.length >= 25) {
        const n = bytes.readUInt32LE(21)
        const w = (n & 0x3fff) + 1
        const h = ((n >> 14) & 0x3fff) + 1
        return {
          file: filePath,
          format: 'WebP (VP8L)',
          sizeBytes,
          width: w,
          height: h,
          aspectRatio: (w / h).toFixed(2),
        }
      }
      if (vp8 && bytes.length >= 30) {
        const frame = bytes.subarray(26, 30)
        const w = frame.readUInt16LE(0) & 0x3fff
        const h = frame.readUInt16LE(2) & 0x3fff
        return { file: filePath, format: 'WebP (VP8)', sizeBytes, width: w, height: h, aspectRatio: (w / h).toFixed(2) }
      }
    }

    return null
  } catch {
    return null
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function image(args: string[]) {
  const { flags, rest } = parseCommonFlags(args)

  const filePath = rest.join(' ').trim()
  if (!filePath) {
    exitWithError('provide an image file path')
  }

  const info = readImageInfo(filePath)
  if (!info) {
    exitWithError(`could not read image "${filePath}" — unsupported format or file not found`)
    return
  }

  if (flags.json) {
    console.log(JSON.stringify({ ...info, sizeBytes: info.sizeBytes, sizeHuman: formatSize(info.sizeBytes) }))
    return
  }

  console.log('')
  console.log(`  ${chalk.bold('🖼 Image Info')}`)
  console.log(`  ${chalk.dim('───────────')}`)
  console.log(`  ${chalk.dim('File:')}       ${chalk.white(info.file)}`)
  console.log(`  ${chalk.dim('Format:')}     ${chalk.green(info.format)}`)
  console.log(`  ${chalk.dim('Size:')}       ${chalk.white(formatSize(info.sizeBytes))}`)
  console.log(`  ${chalk.dim('Dimensions:')} ${chalk.white(`${info.width} × ${info.height}`)}`)
  console.log(`  ${chalk.dim('Aspect:')}     ${chalk.white(info.aspectRatio)}`)
  if (info.colorMode) console.log(`  ${chalk.dim('Color:')}     ${chalk.white(info.colorMode)}`)
  console.log('')
}

const imageHelp = createHelp({
  name: 'image',
  description: 'Show image file metadata (PNG, JPEG, GIF, WebP)',
  usage: 'dt image <file>',
  extra: [`  ${chalk.yellow('Supported formats:')}`, '    PNG, JPEG, GIF, WebP', ''],
  examples: [{ cmd: 'dt image screenshot.png' }, { cmd: 'dt image photo.jpg' }],
})

async function imageInteractive(rl: ReturnType<typeof createInterface>): Promise<void> {
  const filePath = await ask(rl, `  ${chalk.yellow('?')} Image file path: `)
  if (isBack(filePath)) return
  const output = captureOutput(() => image(filePath ? [filePath] : []))
  await pauseWithCopy(rl, output)
}

export const imageCommand: Command = {
  name: 'image',
  aliases: [],
  category: 'media',
  description: 'Show image file metadata (PNG, JPEG, GIF, WebP)',
  run: image,
  help: imageHelp,
  interactive: imageInteractive,
}
