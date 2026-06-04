import { describe, it, expect, vi, beforeEach } from 'vitest'
import { diff } from '../diff.js'
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

describe('diff', () => {
  it('should show diff between two strings at character level', () => {
    const output = captureOutput(() => diff(['abc', 'abd']))
    expect(output).toContain('A:')
    expect(output).toContain('B:')
  })

  it('should read piped input as first string', () => {
    mockReadStdinSync.mockReturnValue('hello')
    const output = captureOutput(() => diff(['world']))
    expect(output).toContain('A:')
    expect(output).toContain('B:')
  })

  it('should exit on missing second string', () => {
    mockReadStdinSync.mockReturnValue('')
    expect(() => diff(['only_one'])).toThrow(ExitError)
  })
})
