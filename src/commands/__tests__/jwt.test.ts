import { describe, it, expect, vi, beforeEach } from 'vitest'
import { jwt } from '../jwt.js'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('jwt', () => {
  it('should decode a valid JWT', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    jwt(['eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiSm9obiJ9.xxx'])
    const output = spy.mock.calls.flatMap((c) => c).join(' ')
    expect(output).toContain('HS256')
    expect(output).toContain('John')
  })

  it('should exit on invalid JWT format', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    jwt(['invalid.token'])
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('should exit on missing token', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    jwt([])
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('should detect expired tokens', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    // JWT with exp in the past (epoch 100000 = Jan 2, 1970)
    const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url')
    const payload = Buffer.from(JSON.stringify({ name: 'John', exp: 100000 })).toString('base64url')
    jwt([`${header}.${payload}.xxx`])
    const output = spy.mock.calls.flatMap((c) => c).join(' ')
    expect(output).toContain('EXPIRED')
  })
})
