import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as utils from '../utils.js'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('readStdinSync', () => {
  it('should return empty string when stdin is a TTY', () => {
    const origDesc = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY')
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true })

    const result = utils.readStdinSync()
    expect(result).toBe('')

    restoreIsTTY(origDesc)
  })
})

function restoreIsTTY(origDesc: PropertyDescriptor | undefined) {
  if (origDesc) {
    Object.defineProperty(process.stdin, 'isTTY', origDesc)
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (process.stdin as any).isTTY
  }
}
