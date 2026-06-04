import { describe, it, expect, vi, beforeEach } from 'vitest'
import { json } from '../json.js'
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

describe('json', () => {
  it('should pretty-print JSON', () => {
    const output = captureOutput(() => json(['{"a":1,"b":{"c":2}}']))
    expect(output).toContain('"a"')
    expect(output).toContain('"b"')
    expect(output).toContain('"c"')
    // Should have newlines for formatting
    expect(output).toContain('\n')
  })

  it('should minify JSON with --minify flag', () => {
    const output = captureOutput(() => json(['{"a":1,"b":2}', '--minify']))
    expect(output).toBe('{"a":1,"b":2}')
  })

  it('should handle -m alias for minify', () => {
    const output = captureOutput(() => json(['{"a":1}', '-m']))
    expect(output).toBe('{"a":1}')
  })

  it('should validate valid JSON with --validate', () => {
    const output = captureOutput(() => json(['{"a":1}', '--validate']))
    expect(output).toContain('Valid')
  })

  it('should exit on invalid JSON with --validate', () => {
    expect(() => json(['not-json', '--validate'])).toThrow(ExitError)
  })

  it('should exit on invalid JSON without --validate', () => {
    expect(() => json(['not-json'])).toThrow(ExitError)
  })

  it('should read from stdin pipe', () => {
    mockReadStdinSync.mockReturnValue('{"a":1}')
    const output = captureOutput(() => json([]))
    expect(output).toContain('"a"')
  })

  it('should exit on missing input', () => {
    mockReadStdinSync.mockReturnValue('')
    expect(() => json([])).toThrow(ExitError)
  })
})
