/**
 * Unified flag parsing utilities for DevKits commands.
 *
 * Provides reusable parsers for common CLI patterns:
 * - `--json` output flag
 * - `--count` / `-c` numeric flag
 * - `--length` / `-l` numeric flag
 * - `--algo` / `-a` algorithm flag
 * - Custom named flags
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface CommonFlags {
  json: boolean
  lower: boolean
}

export interface CountFlag extends CommonFlags {
  count: number
}

export interface LengthFlag extends CommonFlags {
  length: number
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Extract common flags (`--json`) from the args array.
 * Returns the parsed flags and the remaining positional arguments.
 */
export function parseCommonFlags(args: string[]): { flags: CommonFlags; rest: string[] } {
  const rest: string[] = []
  let json = false
  let lower = false
  for (const a of args) {
    if (a === '--json') {
      json = true
    } else if (a === '--lower') {
      lower = true
    } else {
      rest.push(a)
    }
  }
  return { flags: { json, lower }, rest }
}

/**
 * Extract `--json` and `--count` / `-c` flags.
 * Validates that count is a positive integer (max 100).
 */
export function parseCountFlags(
  args: string[],
  opts?: { max?: number; error?: (msg: string) => never },
): { flags: CountFlag; rest: string[] } {
  const { flags: common, rest } = parseCommonFlags(args)
  let count = 1
  const max = opts?.max ?? 100
  const onError = opts?.error ?? defaultError

  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]
    if (a === '--count' || a === '-c') {
      const raw = rest[i + 1]
      if (raw === undefined) {
        onError('--count must be a positive integer')
      }
      const parsed = Number(raw)
      if (!Number.isInteger(parsed) || parsed < 1) {
        onError('--count must be a positive integer')
      }
      count = Math.min(parsed, max)
      rest.splice(i, 2)
      i--
    }
  }

  return { flags: { json: common.json, lower: common.lower, count }, rest }
}

/**
 * Extract `--json` and `--length` / `-l` flags.
 * Validates that length is a positive integer within the given bounds.
 */
export function parseLengthFlags(
  args: string[],
  opts?: { min?: number; max?: number; error?: (msg: string) => never },
): { flags: LengthFlag & { useSymbols: boolean }; rest: string[] } {
  const { flags: common, rest } = parseCommonFlags(args)
  let length = 16
  let useSymbols = true
  const min = opts?.min ?? 1
  const max = opts?.max ?? 256
  const onError = opts?.error ?? defaultError

  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]
    if (a === '--length' || a === '-l') {
      const raw = rest[i + 1]
      const parsed = Number(raw)
      if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
        onError(`--length must be an integer between ${min} and ${max}`)
      }
      length = parsed
      rest.splice(i, 2)
      i--
    } else if (a === '--no-symbols') {
      useSymbols = false
      rest.splice(i, 1)
      i--
    }
  }

  return { flags: { json: common.json, lower: common.lower, length, useSymbols }, rest }
}

/**
 * Parse a named string flag (e.g. `--algo sha256`, `--format colon`).
 */
export function parseStringFlag(
  args: string[],
  flagName: string,
  validValues: string[],
  defaultValue: string,
  error?: (msg: string) => never,
): { value: string; rest: string[] } {
  const rest = [...args]
  const onError = error ?? defaultError

  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === flagName) {
      const raw = rest[i + 1]
      if (!raw || !validValues.includes(raw)) {
        onError(`unsupported value "${raw}" for ${flagName} (supported: ${validValues.join(', ')})`)
      }
      rest.splice(i, 2) // remove flag and value
      return { value: raw ?? defaultValue, rest }
    }
  }

  return { value: defaultValue, rest }
}

function defaultError(msg: string): never {
  throw new Error(msg)
}
