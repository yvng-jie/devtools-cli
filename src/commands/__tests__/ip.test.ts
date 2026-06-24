import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ip } from '../ip.js'
import { ExitError } from '../../errors.js'

beforeEach(() => {
  vi.restoreAllMocks()
})

const mockResponse = {
  status: 'success',
  query: '8.8.8.8',
  city: 'Mountain View',
  region: 'California',
  country: 'United States',
  countryCode: 'US',
  isp: 'Google LLC',
  org: 'Google LLC',
  timezone: 'America/Los_Angeles',
  lat: 37.422,
  lon: -122.084,
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
    expect(output).toContain('Mountain View')
    expect(output).toContain('Google')
  })

  it('should output JSON with --json flag', async () => {
    mockFetch(true, mockResponse)
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await ip(['8.8.8.8', '--json'])
    const output = JSON.parse(spy.mock.calls[0][0])
    expect(output.ip).toBe('8.8.8.8')
    expect(output.city).toBe('Mountain View')
  })

  it('should exit on API error', async () => {
    mockFetch(false, {})
    await expect(ip(['8.8.8.8'])).rejects.toThrow(ExitError)
  })

  it('should exit on invalid IP', async () => {
    mockFetch(true, { status: 'fail' })
    await expect(ip(['bad-ip'])).rejects.toThrow(ExitError)
  })

  it('should handle network timeout', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'))
    await expect(ip(['8.8.8.8'])).rejects.toThrow(ExitError)
  })
})
