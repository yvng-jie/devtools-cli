import { describe, it, expect, vi, beforeEach } from 'vitest'
import { url } from '../url.js'
import { ExitError } from '../../errors.js'

const mockReadStdinSync = vi.hoisted(() => vi.fn())
vi.mock('../../utils.js', () => ({
  readStdinSync: mockReadStdinSync,
}))

beforeEach(() => {
  vi.restoreAllMocks()
  mockReadStdinSync.mockReset()
})

function captureOutput(fn: () => void): string {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
  fn()
  return spy.mock.calls.flatMap((c) => c).join(' ')
}

describe('url', () => {
  it('should encode a URL', () => {
    const output = captureOutput(() => url(['encode', 'hello world']))
    expect(output).toBe('hello%20world')
  })

  it('should decode a URL', () => {
    const output = captureOutput(() => url(['decode', 'hello%20world']))
    expect(output).toBe('hello world')
  })

  it('should parse query string', () => {
    const output = captureOutput(() => url(['parse', '?foo=1&bar=2']))
    expect(output).toContain('foo')
    expect(output).toContain('bar')
  })

  it('should read from stdin pipe', () => {
    mockReadStdinSync.mockReturnValue('hello world')
    const output = captureOutput(() => url(['encode']))
    expect(output).toBe('hello%20world')
  })

  it('should exit on invalid action', () => {
    expect(() => url(['invalid', 'hello'])).toThrow(ExitError)
  })

  it('should exit on missing input', () => {
    mockReadStdinSync.mockReturnValue('')
    expect(() => url(['encode'])).toThrow(ExitError)
  })
})
