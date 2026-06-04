import { describe, it, expect, vi, beforeEach } from 'vitest'
import { csv } from '../csv.js'
import { ExitError } from '../../errors.js'

const mockReadStdinSync = vi.hoisted(() => vi.fn())
vi.mock('../../utils.js', () => ({
  readStdinSync: mockReadStdinSync,
}))

beforeEach(() => {
  vi.restoreAllMocks()
  mockReadStdinSync.mockReset()
})

function captureOutput(fn: () => void): string {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
  fn()
  return spy.mock.calls.flatMap((c) => c).join(' ')
}

describe('csv', () => {
  it('should format CSV with header', () => {
    const output = captureOutput(() => csv(['a,b,c\n1,2,3']))
    expect(output).toContain('a')
    expect(output).toContain('b')
    expect(output).toContain('c')
    expect(output).toContain('1')
    expect(output).toContain('2')
    expect(output).toContain('3')
  })

  it('should read from stdin pipe', () => {
    mockReadStdinSync.mockReturnValue('name,age\nAlice,30')
    const output = captureOutput(() => csv([]))
    expect(output).toContain('Alice')
    expect(output).toContain('30')
  })

  it('should exit on missing input', () => {
    mockReadStdinSync.mockReturnValue('')
    expect(() => csv([])).toThrow(ExitError)
  })
})
