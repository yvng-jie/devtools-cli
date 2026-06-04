import { describe, it, expect, vi, beforeEach } from 'vitest'
import { math } from '../math.js'
import { ExitError } from '../../errors.js'

beforeEach(() => {
  vi.restoreAllMocks()
})

function captureOutput(fn: () => void): string {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
  fn()
  return spy.mock.calls.flatMap((c) => c).join(' ')
}

describe('math', () => {
  it('should evaluate basic arithmetic', () => {
    const output = captureOutput(() => math(['2 + 2']))
    expect(output).toContain('4')
  })

  it('should evaluate sqrt', () => {
    const output = captureOutput(() => math(['sqrt(16)']))
    expect(output).toContain('4')
  })

  it('should evaluate exponentiation with ^', () => {
    const output = captureOutput(() => math(['2^10']))
    expect(output).toContain('1024')
  })

  it('should use Math.PI', () => {
    const output = captureOutput(() => math(['PI']))
    expect(output).toContain('3.14159')
  })

  it('should support --precision flag', () => {
    const output = captureOutput(() => math(['100 / 3', '--precision', '4']))
    expect(output).toContain('33.3333')
  })

  it('should exit on unsupported characters', () => {
    expect(() => math(['process.exit(0)'])).toThrow(ExitError)
  })

  it('should exit on empty input', () => {
    expect(() => math([])).toThrow(ExitError)
  })
})
