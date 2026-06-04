import { describe, it, expect, vi, beforeEach } from 'vitest'
import { image } from '../image.js'
import { ExitError } from '../../errors.js'

beforeEach(() => {
  vi.restoreAllMocks()
})

function captureOutput(fn: () => void): string {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
  fn()
  return spy.mock.calls.flatMap((c) => c).join(' ')
}

describe('image', () => {
  it('should show PNG image metadata', () => {
    const output = captureOutput(() => image(['/tmp/test-image.png']))
    expect(output).toContain('PNG')
    expect(output).toContain('2 × 2')
  })

  it('should show JPEG image metadata', () => {
    const output = captureOutput(() => image(['/tmp/test-image.jpg']))
    expect(output).toContain('JPEG')
  })

  it('should exit on missing file path', () => {
    expect(() => image([])).toThrow(ExitError)
  })

  it('should exit on non-existent file', () => {
    expect(() => image(['/tmp/nonexistent.png'])).toThrow(ExitError)
  })
})
