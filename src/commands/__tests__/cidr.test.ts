import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cidr } from '../cidr.js'
import { ExitError } from '../../errors.js'

beforeEach(() => {
  vi.restoreAllMocks()
})

function captureOutput(fn: () => void): string {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
  fn()
  return spy.mock.calls.flatMap((c) => c).join(' ')
}

describe('cidr', () => {
  it('should calculate /24 network', () => {
    const output = captureOutput(() => cidr(['192.168.1.0/24']))
    expect(output).toContain('192.168.1.0')
    expect(output).toContain('192.168.1.255')
    expect(output).toContain('255.255.255.0')
    expect(output).toContain('254')
  })

  it('should calculate /8 network', () => {
    const output = captureOutput(() => cidr(['10.0.0.0/8']))
    expect(output).toContain('10.0.0.0')
    expect(output).toContain('10.255.255.255')
    expect(output).toContain('255.0.0.0')
  })

  it('should calculate /32 (single host)', () => {
    const output = captureOutput(() => cidr(['192.168.1.1/32']))
    expect(output).toContain('1')
    expect(output).toContain('255.255.255.255')
  })

  it('should calculate /31 (point-to-point, 2 hosts)', () => {
    const output = captureOutput(() => cidr(['10.0.0.0/31']))
    expect(output).toContain('2')
    expect(output).toContain('255.255.255.254')
  })

  it('should handle /0 (entire IPv4 space)', () => {
    const output = captureOutput(() => cidr(['1.2.3.4/0']))
    expect(output).toContain('0.0.0.0')
    expect(output).toContain('255.255.255.255')
    expect(output).toContain('4294967294')
    expect(output).toContain('0.0.0.0')
  })

  it('should handle /16 network', () => {
    const output = captureOutput(() => cidr(['172.16.0.0/16']))
    expect(output).toContain('172.16.0.0')
    expect(output).toContain('172.16.255.255')
    expect(output).toContain('255.255.0.0')
  })

  it('should exit on invalid CIDR', () => {
    expect(() => cidr(['invalid'])).toThrow(ExitError)
  })

  it('should exit on missing input', () => {
    expect(() => cidr([])).toThrow(ExitError)
  })

  it('should exit on out-of-range CIDR prefix', () => {
    expect(() => cidr(['192.168.1.0/33'])).toThrow(ExitError)
  })

  it('should output JSON with --json', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    cidr(['192.168.1.0/24', '--json'])
    const parsed = JSON.parse(spy.mock.calls[0][0])
    expect(parsed.network).toBe('192.168.1.0')
    expect(parsed.broadcast).toBe('192.168.1.255')
    expect(parsed.totalHosts).toBe(254)
  })
})
