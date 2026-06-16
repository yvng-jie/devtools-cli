import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { image } from '../image.js'
import { ExitError } from '../../errors.js'
import { writeFileSync, unlinkSync, existsSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const TEST_PNG = '/tmp/test-image.png'
const TEST_JPG = '/tmp/test-image.jpg'

function crc32(buf: Uint8Array): number {
  const table: number[] = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    table[n] = c
  }
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function createTestImages() {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(2, 0)
  ihdrData.writeUInt32BE(2, 4)
  ihdrData[8] = 8
  ihdrData[9] = 2
  const ihdrType = Buffer.from('IHDR')
  const ihdrPayload = Buffer.concat([ihdrType, ihdrData])
  const ihdrLen = Buffer.alloc(4)
  ihdrLen.writeUInt32BE(13)
  const ihdrCrcBuf = Buffer.alloc(4)
  ihdrCrcBuf.writeUInt32BE(crc32(ihdrPayload))
  const raw = Buffer.from([0, 255, 0, 0, 0, 255, 0, 0, 0, 0, 255, 255, 255, 255])
  const compressed = deflateSync(raw)
  const idatLen = Buffer.alloc(4)
  idatLen.writeUInt32BE(compressed.length)
  const idatType = Buffer.from('IDAT')
  const idatPayload = Buffer.concat([idatType, compressed])
  const idatCrcBuf = Buffer.alloc(4)
  idatCrcBuf.writeUInt32BE(crc32(idatPayload))
  const iend = Buffer.from([0, 0, 0, 0, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82])
  writeFileSync(TEST_PNG, Buffer.concat([sig, ihdrLen, ihdrPayload, ihdrCrcBuf, idatLen, idatPayload, idatCrcBuf, iend]))
  const jpeg = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00,
    0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
    0xFF, 0xDB, 0x00, 0x43, 0x00,
    ...Array(64).fill(1),
    0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00,
    0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01,
    0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02,
    0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B,
    0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
    0xFF, 0xD9,
  ])
  writeFileSync(TEST_JPG, jpeg)
}

beforeEach(() => {
  vi.restoreAllMocks()
  createTestImages()
})

afterEach(() => {
  for (const f of [TEST_PNG, TEST_JPG]) {
    if (existsSync(f)) unlinkSync(f)
  }
})

function captureOutput(fn: () => void): string {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
  fn()
  return spy.mock.calls.flatMap((c) => c).join(' ')
}

describe('image', () => {
  it('should show PNG image metadata', () => {
    const output = captureOutput(() => image(['/tmp/test-image.png']))
    expect(output).toContain('PNG')
    expect(output).toContain('2 × 2')
  })

  it('should show JPEG image metadata', () => {
    const output = captureOutput(() => image(['/tmp/test-image.jpg']))
    expect(output).toContain('JPEG')
  })

  it('should exit on missing file path', () => {
    expect(() => image([])).toThrow(ExitError)
  })

  it('should exit on non-existent file', () => {
    expect(() => image(['/tmp/nonexistent.png'])).toThrow(ExitError)
  })
})
