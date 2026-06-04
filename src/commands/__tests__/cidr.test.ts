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

  it('should exit on invalid CIDR', () => {
    expect(() => cidr(['invalid'])).toThrow(ExitError)
  })

  it('should exit on missing input', () => {
    expect(() => cidr([])).toThrow(ExitError)
  })
})
