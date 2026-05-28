import { randomUUID } from 'node:crypto'
import chalk from 'chalk'
import { exitWithError } from '../errors.js'

export function uuid(args: string[]) {
  const countIdx = args.indexOf('--count') !== -1 ? args.indexOf('--count') : args.indexOf('-c')
  let count = 1
  if (countIdx >= 0) {
    const raw = args[countIdx + 1]
    const parsed = Number(raw)
    if (raw === undefined || !Number.isInteger(parsed) || parsed < 1) {
      exitWithError('--count must be a positive integer')
    }
    count = Math.min(parsed, 100)
  }

  for (let i = 0; i < count; i++) {
    console.log(chalk.green(randomUUID()))
  }
}

export function uuidHelp() {
  console.log(chalk.bold('\n  uuid — Generate random UUID v4'))
  console.log(`  ${chalk.dim('───')}`)
  console.log('')
  console.log(`  ${chalk.yellow('Usage:')}`)
  console.log('    dt uuid [--count <n>]')
  console.log('')
  console.log(`  ${chalk.yellow('Options:')}`)
  console.log('    --count, -c   Number of UUIDs to generate (default: 1, max: 100)')
  console.log('')
  console.log(`  ${chalk.yellow('Examples:')}`)
  console.log('    dt uuid')
  console.log('    dt uuid --count 10')
  console.log('')
}
