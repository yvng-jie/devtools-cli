import { describe, it, expect, vi, beforeEach } from 'vitest'
import { timestamp } from '../timestamp.js'
import { ExitError } from '../../errors.js'

// Mock readStdinSync for pipe tests
const mockReadStdinSync = vi.hoisted(() => vi.fn())
vi.mock('../../utils.js', () => ({
  readStdinSync: mockReadStdinSync,
}))

beforeEach(() => {
  vi.restoreAllMocks()
  mockReadStdinSync.mockReset()
})

// Helper to get all console.log calls joined into a single string
function captureOutput(fn: () => void): string {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
  fn()
  return spy.mock.calls.flatMap((c) => c).join(' ')
}

describe('timestamp', () => {
  it('should output current timestamp when called with no args', () => {
    const output = captureOutput(() => timestamp([]))
    expect(output).toContain('Timestamp:')
    expect(output).toContain('Local:')
    expect(output).toContain('UTC:')
  })

  it('should convert timestamp to readable date', () => {
    const output = captureOutput(() => timestamp(['1716806400']))
    expect(output).toContain('1716806400')
    expect(output).toContain('Local:')
    expect(output).toContain('UTC:')
  })

  it('should handle "now" keyword', () => {
    const output = captureOutput(() => timestamp(['now']))
    expect(output).toContain('Timestamp:')
    expect(output).toContain('Local:')
    expect(output).toContain('UTC:')
  })

  it('should convert date string to timestamp', () => {
    const output = captureOutput(() => timestamp(['2026-05-28']))
    expect(output).toContain('Timestamp:')
  })

  it('should show UTC time with --utc flag', () => {
    const output = captureOutput(() => timestamp(['1716806400', '--utc']))
    expect(output).toContain('UTC:')
    expect(output).not.toContain('Local:')
  })

  it('should show ISO format with --iso flag', () => {
    const output = captureOutput(() => timestamp(['1716806400', '--iso']))
    expect(output).toContain('ISO:')
    expect(output).not.toContain('Local:')
    expect(output).not.toContain('UTC:')
  })

  it('should read from stdin pipe', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockReadStdinSync.mockReturnValue('1716806400')
    timestamp([])
    const output = spy.mock.calls.flatMap((c) => c).join(' ')
    expect(output).toContain('1716806400')
  })

  it('should exit on invalid input', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    expect(() => timestamp(['not-a-date'])).toThrow(ExitError)
  })

  it('should show help with --help flag', () => {
    const output = captureOutput(() => timestamp(['--help']))
    expect(output).toContain('timestamp / ts')
  })

  it('should show help with -h flag', () => {
    const output = captureOutput(() => timestamp(['-h']))
    expect(output).toContain('timestamp / ts')
  })
})
