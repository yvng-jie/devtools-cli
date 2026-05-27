import { randomUUID } from 'node:crypto'
import chalk from 'chalk'

export function uuid(args: string[]) {
  const countIdx = args.indexOf('--count') !== -1 ? args.indexOf('--count') : args.indexOf('-c')
  const count = countIdx >= 0 ? Math.min(Number(args[countIdx + 1]) || 1, 100) : 1

  if (count < 1) {
    console.log(chalk.red('Error: --count must be at least 1'))
    process.exit(1)
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
