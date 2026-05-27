import { describe, it, expect, vi, beforeEach } from 'vitest'
import { color } from '../color.js'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('color', () => {
  it('should parse HEX input', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    color(['#ff7f50'])
    const output = spy.mock.calls.flatMap((c) => c).join(' ')
    expect(output).toContain('#FF7F50')
    expect(output).toContain('rgb(255, 127, 80)')
    expect(output).toContain('hsl(16, 100%, 66%)')
  })

  it('should parse HEX without hash', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    color(['ff7f50'])
    const output = spy.mock.calls.flatMap((c) => c).join(' ')
    expect(output).toContain('#FF7F50')
  })

  it('should parse RGB input', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    color(['rgb(255, 127, 80)'])
    const output = spy.mock.calls.flatMap((c) => c).join(' ')
    expect(output).toContain('#FF7F50')
    expect(output).toContain('rgb(255, 127, 80)')
  })

  it('should parse HSL input', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    color(['hsl(16, 100%, 66%)'])
    const output = spy.mock.calls.flatMap((c) => c).join(' ')
    expect(output).toContain('hsl(16, 100%, 66%)')
    expect(output).toContain('rgb(255, ')
  })

  it('should parse named colors', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    color(['coral'])
    const output = spy.mock.calls.flatMap((c) => c).join(' ')
    expect(output).toContain('#FF7F50')
  })

  it('should exit on unparseable input', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    vi.spyOn(console, 'log').mockImplementation(() => {})
    color(['this-is-not-a-color'])
    expect(exitSpy).toHaveBeenCalledWith(1)
  })
})
