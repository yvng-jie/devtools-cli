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

  it('should evaluate subtraction', () => {
    const output = captureOutput(() => math(['10 - 3']))
    expect(output).toContain('7')
  })

  it('should evaluate multiplication', () => {
    const output = captureOutput(() => math(['4 * 5']))
    expect(output).toContain('20')
  })

  it('should evaluate division', () => {
    const output = captureOutput(() => math(['100 / 4']))
    expect(output).toContain('25')
  })

  it('should evaluate modulo', () => {
    const output = captureOutput(() => math(['10 % 3']))
    expect(output).toContain('1')
  })

  it('should handle operator precedence', () => {
    const output = captureOutput(() => math(['2 + 3 * 4']))
    expect(output).toContain('14')
  })

  it('should handle parentheses', () => {
    const output = captureOutput(() => math(['(2 + 3) * 4']))
    expect(output).toContain('20')
  })

  it('should handle exponentiation with ^', () => {
    const output = captureOutput(() => math(['2^10']))
    expect(output).toContain('1024')
  })

  it('should handle exponentiation with **', () => {
    const output = captureOutput(() => math(['2**10']))
    expect(output).toContain('1024')
  })

  it('should handle unary minus', () => {
    const output = captureOutput(() => math(['-5 + 3']))
    expect(output).toContain('-2')
  })

  it('should handle power with unary minus', () => {
    const output = captureOutput(() => math(['-2^2']))
    expect(output).toContain('-4')
  })

  it('should handle double unary minus', () => {
    const output = captureOutput(() => math(['--5']))
    expect(output).toContain('5')
  })

  it('should evaluate sqrt', () => {
    const output = captureOutput(() => math(['sqrt(16)']))
    expect(output).toContain('4')
  })

  it('should evaluate sin', () => {
    const output = captureOutput(() => math(['sin(0)']))
    expect(output).toContain('0')
  })

  it('should evaluate max with multiple args', () => {
    const output = captureOutput(() => math(['max(1, 5, 3)']))
    expect(output).toContain('5')
  })

  it('should evaluate min with multiple args', () => {
    const output = captureOutput(() => math(['min(1, 5, 3)']))
    expect(output).toContain('1')
  })

  it('should use Math.PI', () => {
    const output = captureOutput(() => math(['PI']))
    expect(output).toContain('3.14159')
  })

  it('should support --precision flag', () => {
    const output = captureOutput(() => math(['100 / 3', '--precision', '4']))
    expect(output).toContain('33.3333')
  })

  it('should exit on RCE attempt with new Function', () => {
    expect(() => math(['process.exit(0)'])).toThrow(ExitError)
  })

  it('should exit on arbitrary code execution attempt', () => {
    expect(() => math(['constructor.constructor("return process")()'])).toThrow(ExitError)
  })

  it('should exit on empty input', () => {
    expect(() => math([])).toThrow(ExitError)
  })

  it('should output JSON with --json', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    math(['2 + 2', '--json'])
    const parsed = JSON.parse(spy.mock.calls[0][0])
    expect(parsed.result).toBe(4)
    expect(parsed.expression).toBe('2 + 2')
  })
})
