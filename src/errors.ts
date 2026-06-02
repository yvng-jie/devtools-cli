import chalk from 'chalk'

/**
 * Error class for command-level failures.
 * Allows commands to throw errors instead of calling process.exit(),
 * which makes them testable and allows interactive mode to catch them.
 */
export class ExitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ExitError'
  }
}

/**
 * Print a red error message and throw an ExitError.
 * Use this instead of `console.log(chalk.red(...)) + process.exit(1)`.
 */
export const exitWithError = (message: string): never => {
  console.log(chalk.red(`Error: ${message}`))
  throw new ExitError(message)
}

/**
 * Print a red error with usage hint and throw an ExitError.
 */
export const exitWithUsage = (message: string, usage: string): never => {
  console.log(chalk.red(`Error: ${message}`))
  console.log(chalk.dim(`  Usage: ${usage}`))
  throw new ExitError(message)
}
