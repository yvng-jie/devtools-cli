import { describe, it, expect, vi, beforeEach } from 'vitest'
import { caseCommand, Format } from '../case.js'
import { ExitError } from '../../errors.js'

beforeEach(() => {
  vi.restoreAllMocks()
})

const ESC = String.fromCharCode(27)
function stripAnsi(text: string): string {
  return text.replace(new RegExp(ESC + '\\[[0-9;]*m', 'g'), '')
}

describe('case', () => {
  describe('conversion', () => {
    const cases: { input: string; format: Format; expected: string }[] = [
      { input: 'helloWorld', format: 'snake', expected: 'hello_world' },
      { input: 'hello-world', format: 'camel', expected: 'helloWorld' },
      { input: 'hello_world', format: 'pascal', expected: 'HelloWorld' },
      { input: 'hello world', format: 'kebab', expected: 'hello-world' },
      { input: 'helloWorld', format: 'upper', expected: 'HELLO_WORLD' },
      { input: 'helloWorld', format: 'lower', expected: 'hello_world' },
      { input: 'helloWorld', format: 'title', expected: 'Hello World' },
      { input: 'HelloWorld', format: 'snake', expected: 'hello_world' },
      { input: 'HELLO_WORLD', format: 'camel', expected: 'helloWorld' },
      { input: 'hello', format: 'upper', expected: 'HELLO' },
      { input: 'HELLO', format: 'lower', expected: 'hello' },
    ]

    for (const { input, format, expected } of cases) {
      it(`should convert "${input}" to ${format} ("${expected}")`, () => {
        const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
        caseCommand([input, '--to', format])
        const output = stripAnsi(spy.mock.calls[0][0] as string)
        expect(output).toBe(expected)
      })
    }
  })

  describe('--json', () => {
    it('should output all formats as JSON', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      caseCommand(['helloWorld', '--json'])
      const output = JSON.parse(spy.mock.calls[0][0] as string)
      expect(output).toEqual({
        input: 'helloWorld',
        camel: 'helloWorld',
        pascal: 'HelloWorld',
        snake: 'hello_world',
        kebab: 'hello-world',
        upper: 'HELLO_WORLD',
        lower: 'hello_world',
        title: 'Hello World',
      })
    })
  })

  describe('no flags', () => {
    it('should display all formats in table', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      caseCommand(['hello'])
      expect(spy).toHaveBeenCalled()
      const lines = spy.mock.calls.map((c) => stripAnsi(c[0] as string))
      expect(lines.some((l) => l.includes('hello')))
      expect(lines.some((l) => l.includes('HELLO')))
    })
  })

  describe('error handling', () => {
    it('should exit on empty input', () => {
      expect(() => caseCommand([])).toThrow(ExitError)
    })

    it('should exit on unsupported --to format', () => {
      expect(() => caseCommand(['hello', '--to', 'unknown'])).toThrow(ExitError)
    })

    it('should exit on --to without value', () => {
      expect(() => caseCommand(['hello', '--to'])).toThrow(ExitError)
    })
  })
})
