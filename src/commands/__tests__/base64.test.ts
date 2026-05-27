import { describe, it, expect, vi, beforeEach } from 'vitest'
import { base64 } from '../base64.js'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('base64', () => {
  it('should encode text to base64', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    base64(['encode', 'hello world'])
    expect(spy).toHaveBeenCalledWith('aGVsbG8gd29ybGQ=')
  })

  it('should decode base64 to text', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    base64(['decode', 'aGVsbG8gd29ybGQ='])
    expect(spy).toHaveBeenCalledWith('hello world')
  })

  it('should exit on invalid action', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    base64(['invalid', 'hello'])
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('should exit on missing input', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    base64(['encode'])
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('should exit on invalid base64 characters in decode mode', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    base64(['decode', 'not-base64!!!'])
    expect(exitSpy).toHaveBeenCalledWith(1)
  })
})
