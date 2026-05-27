import { readFileSync } from 'node:fs'

/**
 * Read input from stdin (non-TTY, e.g. pipe).
 * Returns empty string if stdin is a TTY (interactive terminal).
 */
export function readStdinSync(): string {
  if (process.stdin.isTTY) return ''
  try {
    return readFileSync(0, 'utf-8').trim()
  } catch {
    return ''
  }
}
