import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

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

/** Strip ANSI SGR escape sequences (e.g. chalk coloring codes). */
function stripAnsi(text: string): string {
  return text.replace(/\u001b\[[0-9;]*m/g, '')
}

/**
 * Copy text to the system clipboard using platform-specific commands.
 * - macOS: pbcopy
 * - Linux: xclip (fallback wl-copy)
 * - Windows: clip
 * ANSI escape sequences are automatically stripped.
 * Returns true on success, false if the platform is unsupported or the command fails.
 */
export function copyToClipboard(text: string): boolean {
  const clean = stripAnsi(text)
  try {
    const platform = process.platform
    if (platform === 'darwin') {
      execSync('pbcopy', { input: clean })
      return true
    }
    if (platform === 'linux') {
      try {
        execSync('xclip -selection clipboard', { input: clean })
        return true
      } catch {
        execSync('wl-copy', { input: clean })
        return true
      }
    }
    if (platform === 'win32') {
      execSync('clip', { input: clean })
      return true
    }
    return false
  } catch {
    return false
  }
}
