import { createHmac } from 'node:crypto'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { jwt } from '../jwt.js'
import { ExitError } from '../../errors.js'

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
    expect(() => jwt(['invalid.token'])).toThrow(ExitError)
  })

  it('should exit on missing token', () => {
    expect(() => jwt([])).toThrow(ExitError)
  })

  it('should exit on single-part token', () => {
    expect(() => jwt(['justonepart'])).toThrow(ExitError)
  })

  it('should exit on two-part token', () => {
    expect(() => jwt(['header.payload'])).toThrow(ExitError)
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

  it('should handle non-numeric exp without crashing', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url')
    const payload = Buffer.from(JSON.stringify({ name: 'John', exp: 'not-a-number' })).toString('base64url')
    // Should not throw — just skip expiry display
    expect(() => jwt([`${header}.${payload}.xxx`])).not.toThrow()
  })

  it('should verify valid HMAC signature with --verify', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const secret = 'mysecret'
    const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url')
    const payload = Buffer.from(JSON.stringify({ name: 'John' })).toString('base64url')
    const signingInput = `${header}.${payload}`
    const sig = createHmac('sha256', secret).update(signingInput).digest('base64url')
    const token = `${signingInput}.${sig}`

    jwt([token, '--verify', secret])
    const output = spy.mock.calls.flatMap((c) => c).join(' ')
    expect(output).toContain('Signature valid')
  })

  it('should detect invalid HMAC signature with --verify', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url')
    const payload = Buffer.from(JSON.stringify({ name: 'John' })).toString('base64url')
    const token = `${header}.${payload}.invalidsignature`

    jwt([token, '--verify', 'wrongsecret'])
    const output = spy.mock.calls.flatMap((c) => c).join(' ')
    expect(output).toContain('Signature invalid')
  })

  it('should verify with -k alias', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const secret = 'key'
    const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url')
    const payload = Buffer.from(JSON.stringify({ sub: '123' })).toString('base64url')
    const signingInput = `${header}.${payload}`
    const sig = createHmac('sha256', secret).update(signingInput).digest('base64url')
    const token = `${signingInput}.${sig}`

    jwt([token, '-k', secret])
    const output = spy.mock.calls.flatMap((c) => c).join(' ')
    expect(output).toContain('Signature valid')
  })
})
