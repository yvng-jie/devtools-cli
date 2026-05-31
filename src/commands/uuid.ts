import { randomUUID } from 'node:crypto'
import chalk from 'chalk'
import { exitWithError } from '../errors.js'
import type { Command } from './types.js'

export function uuid(args: string[]) {
  const jsonMode = args.includes('--json')
  const filteredArgs = args.filter((a) => a !== '--json')

  const countIdx = filteredArgs.indexOf('--count') !== -1 ? filteredArgs.indexOf('--count') : filteredArgs.indexOf('-c')
  let count = 1
  if (countIdx >= 0) {
    const raw = filteredArgs[countIdx + 1]
    const parsed = Number(raw)
    if (raw === undefined || !Number.isInteger(parsed) || parsed < 1) {
      exitWithError('--count must be a positive integer')
    }
    count = Math.min(parsed, 100)
  }

  const uuids = Array.from({ length: count }, () => randomUUID())

  if (jsonMode) {
    console.log(JSON.stringify({ uuids }))
  } else {
    for (const id of uuids) {
      console.log(chalk.green(id))
    }
  }
}

function uuidHelp() {
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
export const uuidCommand: Command = {
  name: 'uuid',
  aliases: [],
  description: 'Generate random UUID v4',
  run: uuid,
  help: uuidHelp,
}
