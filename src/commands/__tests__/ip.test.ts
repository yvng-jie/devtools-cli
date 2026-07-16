import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ip } from '../ip.js'
import { ExitError } from '../../errors.js'

beforeEach(() => {
  vi.restoreAllMocks()
})

// ipinfo.io response format
const mockResponse = {
  ip: '8.8.8.8',
  hostname: 'dns.google',
  city: 'Mountain View',
  region: 'California',
  country: 'US',
  loc: '37.4056,-122.0775',
  org: 'AS15169 Google LLC',
  postal: '94043',
  timezone: 'America/Los_Angeles',
  anycast: true,
}

function mockFetch(ok: boolean, data: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok,
    json: () => Promise.resolve(data),
  } as Response)
}

describe('ip', () => {
  it('should fetch and display IP info', async () => {
    mockFetch(true, mockResponse)
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await ip(['8.8.8.8'])
    const output = spy.mock.calls.flatMap((c) => c).join(' ')
    expect(output).toContain('8.8.8.8')
    expect(output).toContain('dns.google')
    expect(output).toContain('Mountain View')
    expect(output).toContain('Google')
    expect(output).toContain('United States (US)')
  })

  it('should output JSON with --json flag', async () => {
    mockFetch(true, mockResponse)
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await ip(['8.8.8.8', '--json'])
    const output = JSON.parse(spy.mock.calls[0][0])
    expect(output.ip).toBe('8.8.8.8')
    expect(output.city).toBe('Mountain View')
    expect(output.countryCode).toBe('US')
  })

  it('should exit on API error', async () => {
    mockFetch(false, {})
    await expect(ip(['8.8.8.8'])).rejects.toThrow(ExitError)
  })

  it('should exit on invalid IP', async () => {
    mockFetch(true, { error: true })
    await expect(ip(['bad-ip'])).rejects.toThrow(ExitError)
  })

  it('should handle network timeout', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'))
    await expect(ip(['8.8.8.8'])).rejects.toThrow(ExitError)
  })
})
