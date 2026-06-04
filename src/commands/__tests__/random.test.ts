import { describe, it, expect, vi, beforeEach } from 'vitest'
import { random } from '../random.js'
import { ExitError } from '../../errors.js'

beforeEach(() => {
  vi.restoreAllMocks()
})

function captureOutput(fn: () => void): string {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
  fn()
  return spy.mock.calls.flatMap((c) => c).join(' ')
}

describe('random', () => {
  it('should generate a password by default', () => {
    const output = captureOutput(() => random(['password']))
    expect(output.length).toBeGreaterThanOrEqual(16)
  })

  it('should respect --length flag', () => {
    const output = captureOutput(() => random(['password', '--length', '32']))
    expect(output.length).toBeGreaterThanOrEqual(32)
  })

  it('should generate password without symbols with --no-symbols', () => {
    const output = captureOutput(() => random(['password', '--length', '20', '--no-symbols']))
    // Should only contain alphanumeric characters
    expect(output).toMatch(/^[a-zA-Z0-9\n]+$/)
  })

  it('should generate random numbers', () => {
    const output = captureOutput(() => random(['number', '--min', '1', '--max', '10']))
    const num = Number(output.trim())
    expect(num).toBeGreaterThanOrEqual(1)
    expect(num).toBeLessThanOrEqual(10)
  })

  it('should generate multiple values with --count', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    random(['password', '--count', '3'])
    expect(spy).toHaveBeenCalledTimes(3)
  })

  it('should exit on invalid --length', () => {
    expect(() => random(['password', '--length', '-1'])).toThrow(ExitError)
  })

  it('should exit on invalid --count', () => {
    expect(() => random(['password', '--count', '0'])).toThrow(ExitError)
  })
})
