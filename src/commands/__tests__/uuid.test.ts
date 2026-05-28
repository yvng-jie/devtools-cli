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
})
