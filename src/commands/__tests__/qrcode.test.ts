import { describe, it, expect, vi, beforeEach } from 'vitest'
import { qrcode } from '../qrcode.js'
import { ExitError } from '../../errors.js'

const mockReadStdinSync = vi.hoisted(() => vi.fn())
vi.mock('../../utils.js', () => ({
  readStdinSync: mockReadStdinSync,
}))

beforeEach(() => {
  vi.restoreAllMocks()
  mockReadStdinSync.mockReset()
})

function captureOutput(fn: () => Promise<void>): Promise<string> {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
  return fn().then(() => spy.mock.calls.flatMap((c) => c).join(' '))
}

describe('qrcode', () => {
  it('should generate a QR code for text input', async () => {
    const output = await captureOutput(() => qrcode(['hello']))
    expect(output).toContain('hello')
    expect(output).toContain('Version:')
    expect(output).toContain('Size:')
  })

  it('should read from stdin pipe', async () => {
    mockReadStdinSync.mockReturnValue('hello')
    const output = await captureOutput(() => qrcode([]))
    expect(output).toContain('hello')
    expect(output).toContain('Version:')
  })

  it('should exit on missing input', async () => {
    mockReadStdinSync.mockReturnValue('')
    await expect(qrcode([])).rejects.toThrow(ExitError)
  })
})
