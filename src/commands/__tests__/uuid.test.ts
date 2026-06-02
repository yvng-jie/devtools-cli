import { describe, it, expect, vi, beforeEach } from 'vitest'
import { uuid } from '../uuid.js'
import { ExitError } from '../../errors.js'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('uuid', () => {
  it('should generate a single UUID by default', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    uuid([])
    expect(spy).toHaveBeenCalledTimes(1)
    const output = spy.mock.calls[0][0]
    expect(output).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  it('should generate multiple UUIDs with --count', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    uuid(['--count', '3'])
    expect(spy).toHaveBeenCalledTimes(3)
  })

  it('should cap count at 100', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    uuid(['--count', '999'])
    expect(spy).toHaveBeenCalledTimes(100)
  })

  it('should handle -c alias', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    uuid(['-c', '2'])
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('should exit on invalid --count (non-numeric)', () => {
    expect(() => uuid(['--count', 'abc'])).toThrow(ExitError)
  })

  it('should exit on --count 0', () => {
    expect(() => uuid(['--count', '0'])).toThrow(ExitError)
  })

  it('should exit on --count negative', () => {
    expect(() => uuid(['--count', '-5'])).toThrow(ExitError)
  })

  it('should exit on --count without value', () => {
    expect(() => uuid(['--count'])).toThrow(ExitError)
  })

  it('should generate UUID v1 with --version 1', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    uuid(['--version', '1'])
    const output = spy.mock.calls[0][0]
    // v1 UUID: version digit should be 1
    expect(output).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  it('should generate UUID v7 with --version 7', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    uuid(['--version', '7'])
    const output = spy.mock.calls[0][0]
    // v7 UUID: version digit should be 7
    expect(output).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  it('should generate v4 by default (no --version flag)', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    uuid([])
    const output = spy.mock.calls[0][0]
    expect(output).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  it('should exit on unsupported version', () => {
    expect(() => uuid(['--version', '3'])).toThrow(ExitError)
  })

  it('should handle -v alias for version', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    uuid(['-v', '7'])
    const output = spy.mock.calls[0][0]
    expect(output).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })
})
