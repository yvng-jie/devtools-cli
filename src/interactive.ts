import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { uuid } from './commands/uuid.js'
import { base64 } from './commands/base64.js'
import { color } from './commands/color.js'
import { jwt } from './commands/jwt.js'
import { hash } from './commands/hash.js'

function ask(rl: ReturnType<typeof createInterface>, query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve))
}

export async function interactive() {
  console.log('')
  console.log(`  ${chalk.bold.cyan('╭──────────────────────────────────╮')}`)
  console.log(`  ${chalk.bold.cyan('│')}     ${chalk.bold('🔧 DT — Developer Toolkit')}     ${chalk.bold.cyan('│')}`)
  console.log(`  ${chalk.bold.cyan('╰──────────────────────────────────╯')}`)
  console.log('')

  const rl = createInterface({ input: process.stdin, output: process.stdout })

  while (true) {
    console.log(`  ${chalk.yellow('Select a command:')}`)
    console.log(`    ${chalk.green('1)')} uuid     ${chalk.dim('— Generate UUID v4')}`)
    console.log(`    ${chalk.green('2)')} base64   ${chalk.dim('— Encode / Decode Base64')}`)
    console.log(`    ${chalk.green('3)')} color    ${chalk.dim('— Convert colors (HEX / RGB / HSL)')}`)
    console.log(`    ${chalk.green('4)')} jwt      ${chalk.dim('— Decode a JWT token')}`)
    console.log(`    ${chalk.green('5)')} hash     ${chalk.dim('— Generate SHA hash')}`)
    console.log(`    ${chalk.red('0)')} Exit`)
    console.log('')

    const choice = (await ask(rl, `  ${chalk.yellow('?')} Choose ${chalk.dim('[0-5]')}: `)).trim()

    switch (choice) {
      case '1': {
        const count = (await ask(rl, `  ${chalk.yellow('?')} How many UUIDs? ${chalk.dim('(1)')}: `)).trim()
        uuid(count ? ['--count', count] : [])
        break
      }
      case '2': {
        const action =
          (await ask(rl, `  ${chalk.yellow('?')} encode or decode? ${chalk.dim('(encode)')}: `)).trim() || 'encode'
        const input = await ask(rl, `  ${chalk.yellow('?')} Input text: `)
        base64(input ? [action, input] : [action])
        break
      }
      case '3': {
        const input = await ask(
          rl,
          `  ${chalk.yellow('?')} Color value ${chalk.dim('(e.g. #ff7f50, coral, rgb(255,127,80))')}: `,
        )
        color(input ? [input] : [])
        break
      }
      case '4': {
        const token = await ask(rl, `  ${chalk.yellow('?')} JWT token: `)
        jwt(token ? [token] : [])
        break
      }
      case '5': {
        const input = await ask(rl, `  ${chalk.yellow('?')} Text to hash: `)
        const algo = (
          await ask(
            rl,
            `  ${chalk.yellow('?')} Algorithm ${chalk.dim('(sha256/sha1/sha384/sha512)')} ${chalk.dim('[sha256]')}: `,
          )
        ).trim()
        hash(input ? (algo ? [input, '--algo', algo] : [input]) : [])
        break
      }
      case '0':
      case '':
        console.log(`\n  ${chalk.dim('Bye!')}\n`)
        rl.close()
        return
      default:
        console.log(`  ${chalk.red('Invalid choice, try again.')}\n`)
    }
    console.log('')
  }
}
