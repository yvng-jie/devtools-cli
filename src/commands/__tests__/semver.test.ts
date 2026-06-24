import { describe, it, expect, vi, beforeEach } from 'vitest'
import { semver } from '../semver.js'
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

describe('semver', () => {
  it('should parse a valid semver', () => {
    const output = captureOutput(() => semver(['1.2.3']))
    expect(output).toContain('1')
    expect(output).toContain('2')
    expect(output).toContain('3')
    expect(output).toContain('stable')
  })

  it('should parse pre-release version', () => {
    const output = captureOutput(() => semver(['1.2.3-beta.1']))
    expect(output).toContain('pre-release')
    expect(output).toContain('beta.1')
  })

  it('should parse version with build metadata', () => {
    const output = captureOutput(() => semver(['1.2.3+build.42']))
    expect(output).toContain('stable')
  })

  it('should validate a valid semver with --validate', () => {
    const output = captureOutput(() => semver(['1.2.3', '--validate']))
    expect(output).toContain('Valid semver')
  })

  it('should exit on invalid semver', () => {
    expect(() => semver(['not-a-version'])).toThrow(ExitError)
  })

  it('should exit on invalid --validate', () => {
    expect(() => semver(['not-a-version', '--validate'])).toThrow(ExitError)
  })

  it('should exit on empty input', () => {
    mockReadStdinSync.mockReturnValue('')
    expect(() => semver([])).toThrow(ExitError)
  })

  it('should handle stdin pipe', () => {
    mockReadStdinSync.mockReturnValue('2.0.0')
    const output = captureOutput(() => semver([]))
    expect(output).toContain('2')
    expect(output).toContain('0')
  })

  it('should compare versions with --compare', () => {
    const output = captureOutput(() => semver(['1.2.3', '--compare', '2.0.0']))
    expect(output).toContain('<')
  })

  it('should compare equal versions', () => {
    const output = captureOutput(() => semver(['1.2.3', '--compare', '1.2.3']))
    expect(output).toContain('==')
  })

  it('should compare greater version', () => {
    const output = captureOutput(() => semver(['3.0.0', '--compare', '1.2.3']))
    expect(output).toContain('>')
  })

  it('should bump major version', () => {
    const output = captureOutput(() => semver(['1.2.3', '--major']))
    expect(output).toContain('2.0.0')
  })

  it('should bump minor version', () => {
    const output = captureOutput(() => semver(['1.2.3', '--minor']))
    expect(output).toContain('1.3.0')
  })

  it('should bump patch version', () => {
    const output = captureOutput(() => semver(['1.2.3', '--patch']))
    expect(output).toContain('1.2.4')
  })

  it('should output JSON with --json', () => {
    const output = captureOutput(() => semver(['1.2.3', '--json']))
    const parsed = JSON.parse(output)
    expect(parsed.major).toBe(1)
    expect(parsed.minor).toBe(2)
    expect(parsed.patch).toBe(3)
  })

  it('should handle pre-release comparison correctly', () => {
    const output = captureOutput(() => semver(['1.0.0-alpha', '--compare', '1.0.0']))
    expect(output).toContain('<')
  })
})
