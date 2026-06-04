import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mac } from '../mac.js'
import { ExitError } from '../../errors.js'

beforeEach(() => {
  vi.restoreAllMocks()
})

function captureOutput(fn: () => void): string {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
  fn()
  return spy.mock.calls.flatMap((c) => c).join(' ')
}

describe('mac', () => {
  it('should format colon-separated MAC by default', () => {
    const output = captureOutput(() => mac(['aa:bb:cc:dd:ee:ff']))
    expect(output).toContain('aa:bb:cc:dd:ee:ff')
  })

  it('should normalize hyphen-separated MAC', () => {
    const output = captureOutput(() => mac(['AA-BB-CC-DD-EE-FF']))
    expect(output).toContain('aa:bb:cc:dd:ee:ff')
  })

  it('should normalize dot-separated MAC', () => {
    const output = captureOutput(() => mac(['aabb.ccdd.eeff']))
    expect(output).toContain('aa:bb:cc:dd:ee:ff')
  })

  it('should display all formats by default', () => {
    const output = captureOutput(() => mac(['aa:bb:cc:dd:ee:ff']))
    expect(output).toContain('AA:BB:CC:DD:EE:FF')
    expect(output).toContain('AA-BB-CC-DD-EE-FF')
    expect(output).toContain('AABB.CCDD.EEFF')
    expect(output).toContain('aa:bb:cc:dd:ee:ff')
  })

  it('should exit on invalid MAC', () => {
    expect(() => mac(['not-a-mac'])).toThrow(ExitError)
  })

  it('should exit on missing input', () => {
    expect(() => mac([])).toThrow(ExitError)
  })
})
