import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as utils from '../utils.js'

const mockExecSync = vi.hoisted(() => vi.fn())
vi.mock('node:child_process', () => ({
  execSync: mockExecSync,
}))

beforeEach(() => {
  vi.restoreAllMocks()
  mockExecSync.mockReset()
})

describe('readStdinSync', () => {
  it('should return empty string when stdin is a TTY', () => {
    const origDesc = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY')
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true })

    const result = utils.readStdinSync()
    expect(result).toBe('')

    restoreIsTTY(origDesc)
  })
})

function restoreIsTTY(origDesc: PropertyDescriptor | undefined) {
  if (origDesc) {
    Object.defineProperty(process.stdin, 'isTTY', origDesc)
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (process.stdin as any).isTTY
  }
}

describe('copyToClipboard', () => {
  const originalPlatform = process.platform

  function setPlatform(platform: string) {
    Object.defineProperty(process, 'platform', { value: platform, configurable: true })
  }

  beforeEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true })
  })

  it('should return true on macOS with pbcopy', () => {
    setPlatform('darwin')
    mockExecSync.mockReturnValue(undefined)
    expect(utils.copyToClipboard('hello')).toBe(true)
    expect(mockExecSync).toHaveBeenCalledWith('pbcopy', { input: 'hello' })
  })

  it('should strip ANSI codes before copying', () => {
    setPlatform('darwin')
    mockExecSync.mockReturnValue(undefined)
    expect(utils.copyToClipboard('\u001b[32mhello\u001b[0m')).toBe(true)
    expect(mockExecSync).toHaveBeenCalledWith('pbcopy', { input: 'hello' })
  })

  it('should return true on Linux with xclip', () => {
    setPlatform('linux')
    mockExecSync.mockReturnValue(undefined)
    expect(utils.copyToClipboard('hello')).toBe(true)
    expect(mockExecSync).toHaveBeenCalledWith('xclip -selection clipboard', { input: 'hello' })
  })

  it('should fall back to wl-copy on Linux when xclip fails', () => {
    setPlatform('linux')
    mockExecSync
      .mockImplementationOnce(() => {
        throw new Error('xclip not found')
      })
      .mockReturnValueOnce(undefined)
    expect(utils.copyToClipboard('hello')).toBe(true)
    expect(mockExecSync).toHaveBeenCalledWith('wl-copy', { input: 'hello' })
  })

  it('should return true on Windows with clip', () => {
    setPlatform('win32')
    mockExecSync.mockReturnValue(undefined)
    expect(utils.copyToClipboard('hello')).toBe(true)
    expect(mockExecSync).toHaveBeenCalledWith('clip', { input: 'hello' })
  })

  it('should return false on unsupported platform', () => {
    setPlatform('android')
    expect(utils.copyToClipboard('hello')).toBe(false)
  })

  it('should return false when clipboard command fails', () => {
    setPlatform('darwin')
    mockExecSync.mockImplementation(() => {
      throw new Error('command not found')
    })
    expect(utils.copyToClipboard('hello')).toBe(false)
  })
})
