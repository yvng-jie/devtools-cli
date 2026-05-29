import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { uuid } from './commands/uuid.js'
import { base64 } from './commands/base64.js'
import { color } from './commands/color.js'
import { jwt } from './commands/jwt.js'
import { hash } from './commands/hash.js'
import { timestamp } from './commands/timestamp.js'
import { ExitError } from './errors.js'

function ask(rl: ReturnType<typeof createInterface>, query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve))
}

/** Check if user wants to go back to the main menu. */
function isBack(input: string): boolean {
  return input.trim().toLowerCase() === 'b' || input.trim().toLowerCase() === 'back'
}

/** Show a pause message and wait for Enter. */
async function pause(rl: ReturnType<typeof createInterface>): Promise<void> {
  await ask(rl, `  ${chalk.dim('Press Enter to return to menu...')}`)
}

/**
 * Run a command function inside a try-catch so that errors
 * don't crash the interactive loop — they just print and return to the menu.
 */
function runSafe<T>(fn: () => T): T | undefined {
  try {
    return fn()
  } catch (err) {
    if (err instanceof ExitError) {
      // Error already printed by exitWithError, just return to menu
      return undefined
    }
    console.log(`  ${chalk.red(`Unexpected error: ${err}`)}`)
    return undefined
  }
}

export async function interactive() {
  console.log('')
  console.log(`  ${chalk.bold.cyan('╭──────────────────────────────────╮')}`)
  console.log(`  ${chalk.bold.cyan('│')}     ${chalk.bold('🔧 DT — Developer Toolkit')}     ${chalk.bold.cyan('│')}`)
  console.log(`  ${chalk.bold.cyan('╰──────────────────────────────────╯')}`)
  console.log('')

  const rl = createInterface({ input: process.stdin, output: process.stdout })

  // Handle Ctrl+C: exit cleanly
  rl.on('SIGINT', () => {
    console.log(`\n  ${chalk.dim('Bye!')}\n`)
    rl.close()
    process.exit(0)
  })

  try {
    while (true) {
      console.log(`  ${chalk.yellow('Select a command:')}`)
      console.log(`    ${chalk.green('1/u')} uuid     ${chalk.dim('— Generate UUID v4')}`)
      console.log(`    ${chalk.green('2/b')} base64   ${chalk.dim('— Encode / Decode Base64')}`)
      console.log(`    ${chalk.green('3/c')} color    ${chalk.dim('— Convert colors (HEX / RGB / HSL)')}`)
      console.log(`    ${chalk.green('4/j')} jwt      ${chalk.dim('— Decode a JWT token')}`)
      console.log(`    ${chalk.green('5/h')} hash     ${chalk.dim('— Generate SHA hash')}`)
      console.log(`    ${chalk.green('6/t')} ts       ${chalk.dim('— Convert Unix timestamps and dates')}`)
      console.log(`    ${chalk.red('0/q)')} Exit`)
      console.log('')

      let choice: string
      try {
        choice = (await ask(rl, `  ${chalk.yellow('?')} Choose ${chalk.dim('[0-6]')}: `)).trim().toLowerCase()
      } catch {
        // readline closed (e.g. Ctrl+D), exit gracefully
        console.log(`\n  ${chalk.dim('Bye!')}\n`)
        return
      }

      switch (choice) {
        case '1':
        case 'u':
        case 'uuid': {
          const countRaw = (await ask(rl, `  ${chalk.yellow('?')} How many UUIDs? ${chalk.dim('(1)')}: `)).trim()
          if (isBack(countRaw)) break
          runSafe(() => uuid(countRaw ? ['--count', countRaw] : []))
          await pause(rl)
          break
        }
        case '2':
        case 'b':
        case 'base64': {
          const actionRaw = (
            await ask(rl, `  ${chalk.yellow('?')} encode or decode? ${chalk.dim('(encode)')}: `)
          ).trim()
          if (isBack(actionRaw)) break
          const action = actionRaw || 'encode'
          const hint = action === 'decode' ? '(base64 string, e.g. aGVsbG8=)' : '(plain text, e.g. hello)'
          const input = await ask(rl, `  ${chalk.yellow('?')} Input ${hint}: `)
          if (isBack(input)) break
          runSafe(() => base64(input ? [action, input] : [action]))
          await pause(rl)
          break
        }
        case '3':
        case 'c':
        case 'color': {
          const input = await ask(
            rl,
            `  ${chalk.yellow('?')} Color value ${chalk.dim('(e.g. #ff7f50, coral, rgb(255,127,80))')}: `,
          )
          if (isBack(input)) break
          runSafe(() => color(input ? [input] : []))
          await pause(rl)
          break
        }
        case '4':
        case 'j':
        case 'jwt': {
          const token = await ask(rl, `  ${chalk.yellow('?')} JWT token: `)
          if (isBack(token)) break
          runSafe(() => jwt(token ? [token] : []))
          await pause(rl)
          break
        }
        case '5':
        case 'h':
        case 'hash': {
          const input = await ask(rl, `  ${chalk.yellow('?')} Text to hash: `)
          if (isBack(input)) break
          const algo = (
            await ask(
              rl,
              `  ${chalk.yellow('?')} Algorithm ${chalk.dim('(sha256/sha1/sha384/sha512)')} ${chalk.dim('[sha256]')}: `,
            )
          ).trim()
          if (isBack(algo)) break
          runSafe(() => hash(input ? (algo ? [input, '--algo', algo] : [input]) : []))
          await pause(rl)
          break
        }
        case '6':
        case 't':
        case 'ts':
        case 'timestamp': {
          const input = await ask(
            rl,
            `  ${chalk.yellow('?')} Value ${chalk.dim('(timestamp, date string, or "now")')} ${chalk.dim('[now]')}: `,
          )
          if (isBack(input)) break
          runSafe(() => timestamp(input ? [input] : []))
          await pause(rl)
          break
        }
        case '0':
        case 'q':
        case 'quit':
        case 'exit':
        case '':
          console.log(`\n  ${chalk.dim('Bye!')}\n`)
          rl.close()
          return
        default:
          console.log(`  ${chalk.red('Invalid choice, try again.')}\n`)
      }
      console.log('')
    }
  } finally {
    rl.close()
  }
}
