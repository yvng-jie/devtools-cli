import chalk from 'chalk'
import { copyToClipboard } from './utils.js'
import { createInterface } from 'node:readline'

/**
 * Prompt the user with a question and return the answer.
 */
export function ask(rl: ReturnType<typeof createInterface>, query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve))
}

/**
 * Check if user wants to go back to the main menu.
 */
export function isBack(input: string): boolean {
  return input.trim().toLowerCase() === 'b' || input.trim().toLowerCase() === 'back'
}

/**
 * Show a pause message with optional clipboard copy.
 * Used by interactive command handlers after displaying results.
 */
export async function pauseWithCopy(rl: ReturnType<typeof createInterface>, output: string[]): Promise<void> {
  if (output.length > 0) {
    const answer = (await ask(rl, `  ${chalk.dim('[C] Copy to clipboard, Enter to continue:')}`)).trim().toLowerCase()
    if (answer === 'c') {
      const text = output.join('\n')
      if (copyToClipboard(text)) {
        console.log(`  ${chalk.green('✓ Copied to clipboard!')}`)
      } else {
        console.log(`  ${chalk.red('✗ Failed to copy — clipboard tool not found')}`)
      }
      await ask(rl, `  ${chalk.dim('Press Enter to return to menu...')}`)
    }
  } else {
    await ask(rl, `  ${chalk.dim('Press Enter to return to menu...')}`)
  }
}

/**
 * Run a function that calls console.log and capture its output.
 * Returns the captured lines while also printing them to the console.
 */
export function captureOutput(fn: () => void): string[] {
  const captured: string[] = []
  const origLog = console.log
  console.log = (...args: unknown[]) => {
    const line = args.map((a) => (typeof a === 'string' ? a : String(a))).join(' ')
    captured.push(line)
    origLog(...args)
  }
  try {
    fn()
  } finally {
    console.log = origLog
  }
  return captured
}

/**
 * Run an async function that calls console.log and capture its output.
 * Returns the captured lines while also printing them to the console.
 */
export async function captureOutputAsync(fn: () => Promise<void>): Promise<string[]> {
  const captured: string[] = []
  const origLog = console.log
  console.log = (...args: unknown[]) => {
    const line = args.map((a) => (typeof a === 'string' ? a : String(a))).join(' ')
    captured.push(line)
    origLog(...args)
  }
  try {
    await fn()
  } finally {
    console.log = origLog
  }
  return captured
}
