import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hash } from '../hash.js'
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

describe('hash', () => {
  it('should compute sha256 by default', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    hash(['hello'])
    const output = spy.mock.calls.flatMap((c) => c).join(' ')
    expect(output).toContain('SHA256')
    expect(output).toContain('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')
  })

  it('should compute sha512 with --algo', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    hash(['hello', '--algo', 'sha512'])
    const output = spy.mock.calls.flatMap((c) => c).join(' ')
    expect(output).toContain('SHA512')
    expect(output).toContain(
      '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043',
    )
  })

  it('should compute sha1 with -a alias', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    hash(['hello', '-a', 'sha1'])
    const output = spy.mock.calls.flatMap((c) => c).join(' ')
    expect(output).toContain('SHA1')
    expect(output).toContain('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d')
  })

  it('should compute hash from stdin pipe', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockReadStdinSync.mockReturnValue('hello')
    hash([])
    const output = spy.mock.calls.flatMap((c) => c).join(' ')
    expect(output).toContain('SHA256')
    expect(output).toContain('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')
  })

  it('should handle stdin with --algo', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockReadStdinSync.mockReturnValue('hello')
    hash(['--algo', 'sha512'])
    const output = spy.mock.calls.flatMap((c) => c).join(' ')
    expect(output).toContain('SHA512')
  })

  it('should exit on unsupported algorithm', () => {
    expect(() => hash(['hello', '--algo', 'md5'])).toThrow(ExitError)
  })

  it('should exit on missing input', () => {
    mockReadStdinSync.mockReturnValue('')
    expect(() => hash([])).toThrow(ExitError)
  })
})
