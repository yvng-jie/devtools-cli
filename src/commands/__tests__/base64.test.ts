import { describe, it, expect, vi, beforeEach } from 'vitest'
import { base64 } from '../base64.js'
import { ExitError } from '../../errors.js'

// Mock readStdinSync to control piped input in tests
const mockReadStdinSync = vi.hoisted(() => vi.fn())
vi.mock('../../utils.js', () => ({
  readStdinSync: mockReadStdinSync,
}))

beforeEach(() => {
  vi.restoreAllMocks()
  mockReadStdinSync.mockReset()
})

describe('base64', () => {
  it('should encode text to base64', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    base64(['encode', 'hello world'])
    expect(spy).toHaveBeenCalledWith('aGVsbG8gd29ybGQ=')
  })

  it('should decode base64 to text', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    base64(['decode', 'aGVsbG8gd29ybGQ='])
    expect(spy).toHaveBeenCalledWith('hello world')
  })

  it('should encode from stdin pipe', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockReadStdinSync.mockReturnValue('hello world')
    base64(['encode'])
    expect(spy).toHaveBeenCalledWith('aGVsbG8gd29ybGQ=')
  })

  it('should decode from stdin pipe', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockReadStdinSync.mockReturnValue('aGVsbG8gd29ybGQ=')
    base64(['decode'])
    expect(spy).toHaveBeenCalledWith('hello world')
  })

  it('should exit on invalid action', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    expect(() => base64(['invalid', 'hello'])).toThrow(ExitError)
  })

  it('should exit on missing input', () => {
    mockReadStdinSync.mockReturnValue('')
    expect(() => base64(['encode'])).toThrow(ExitError)
  })

  it('should exit on invalid base64 characters in decode mode', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    expect(() => base64(['decode', 'not-base64!!!'])).toThrow(ExitError)
  })
})
