import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { commands } from './commands/index.js'
import { copyToClipboard } from './utils.js'
import { ExitError } from './errors.js'

function ask(rl: ReturnType<typeof createInterface>, query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve))
}

/** Check if user wants to go back to the main menu. */
function isBack(input: string): boolean {
  return input.trim().toLowerCase() === 'b' || input.trim().toLowerCase() === 'back'
}

/**
 * Run a command function, capture its console output, and handle errors.
 * Returns the captured output lines (empty if nothing was logged or on error).
 */
function runSafeCapture(fn: () => void): string[] {
  const captured: string[] = []
  const origLog = console.log
  console.log = (...args: unknown[]) => {
    const line = args.map((a) => (typeof a === 'string' ? a : String(a))).join(' ')
    captured.push(line)
    origLog(...args)
  }
  try {
    fn()
  } catch (err) {
    if (err instanceof ExitError) {
      return captured
    }
    origLog(`  ${chalk.red(`Unexpected error: ${err}`)}`)
  } finally {
    console.log = origLog
  }
  return captured
}

/** Show a pause message with optional clipboard copy. */
async function pauseWithCopy(rl: ReturnType<typeof createInterface>, output: string[]): Promise<void> {
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

// ── Interactive prompt handlers per command ────────────────────────────────

type InteractiveHandler = (rl: ReturnType<typeof createInterface>) => Promise<void>

const interactiveHandlers: Record<string, InteractiveHandler> = {
  async uuid(rl) {
    const countRaw = (await ask(rl, `  ${chalk.yellow('?')} How many UUIDs? ${chalk.dim('(1)')}: `)).trim()
    if (isBack(countRaw)) return
    const output = runSafeCapture(() => commands[0].run(countRaw ? ['--count', countRaw] : []))
    await pauseWithCopy(rl, output)
  },
  async base64(rl) {
    const actionRaw = (await ask(rl, `  ${chalk.yellow('?')} encode or decode? ${chalk.dim('(encode)')}: `)).trim()
    if (isBack(actionRaw)) return
    const action = actionRaw || 'encode'
    const hint = action === 'decode' ? '(base64 string, e.g. aGVsbG8=)' : '(plain text, e.g. hello)'
    const input = await ask(rl, `  ${chalk.yellow('?')} Input ${hint}: `)
    if (isBack(input)) return
    const output = runSafeCapture(() => commands[1].run(input ? [action, input] : [action]))
    await pauseWithCopy(rl, output)
  },
  async color(rl) {
    const input = await ask(
      rl,
      `  ${chalk.yellow('?')} Color value ${chalk.dim('(e.g. #ff7f50, coral, rgb(255,127,80))')}: `,
    )
    if (isBack(input)) return
    const output = runSafeCapture(() => commands[2].run(input ? [input] : []))
    await pauseWithCopy(rl, output)
  },
  async jwt(rl) {
    const token = await ask(rl, `  ${chalk.yellow('?')} JWT token: `)
    if (isBack(token)) return
    const output = runSafeCapture(() => commands[3].run(token ? [token] : []))
    await pauseWithCopy(rl, output)
  },
  async hash(rl) {
    const input = await ask(rl, `  ${chalk.yellow('?')} Text to hash: `)
    if (isBack(input)) return
    const algo = (
      await ask(
        rl,
        `  ${chalk.yellow('?')} Algorithm ${chalk.dim('(sha256/sha1/sha384/sha512)')} ${chalk.dim('[sha256]')}: `,
      )
    ).trim()
    if (isBack(algo)) return
    const output = runSafeCapture(() => commands[4].run(input ? (algo ? [input, '--algo', algo] : [input]) : []))
    await pauseWithCopy(rl, output)
  },
  async timestamp(rl) {
    const input = await ask(
      rl,
      `  ${chalk.yellow('?')} Value ${chalk.dim('(timestamp, date string, or "now")')} ${chalk.dim('[now]')}: `,
    )
    if (isBack(input)) return
    const output = runSafeCapture(() => commands[5].run(input ? [input] : []))
    await pauseWithCopy(rl, output)
  },
}

// Build choice mapping: number keys, letter keys, and name keys → command name
function buildChoiceMap(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const [i, cmd] of commands.entries()) {
    const numKey = String(i + 1)
    map[numKey] = cmd.name
    map[cmd.name] = cmd.name
    for (const alias of cmd.aliases) {
      map[alias] = cmd.name
    }
    // First character of name/alias as shortcut
    map[cmd.name[0]] = cmd.name
    for (const alias of cmd.aliases) {
      map[alias[0]] = cmd.name
    }
  }
  return map
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

  const choiceMap = buildChoiceMap()

  try {
    while (true) {
      console.log(`  ${chalk.yellow('Select a command:')}`)
      for (const [i, cmd] of commands.entries()) {
        const numKey = i + 1
        const letterKey = cmd.name[0]
        const displayName = cmd.aliases.length > 0 ? cmd.aliases[0] : cmd.name
        console.log(
          `    ${chalk.green(`${numKey}/${letterKey}`).padEnd(8)} ${displayName.padEnd(12)} ${chalk.dim('— ' + cmd.description)}`,
        )
      }
      console.log(`    ${chalk.red('0/q)')} Exit`)
      console.log('')

      let choice: string
      try {
        const range = `[0-${commands.length}]`
        choice = (await ask(rl, `  ${chalk.yellow('?')} Choose ${chalk.dim(range)}: `)).trim().toLowerCase()
      } catch {
        console.log(`\n  ${chalk.dim('Bye!')}\n`)
        return
      }

      if (choice === '0' || choice === 'q' || choice === 'quit' || choice === 'exit' || choice === '') {
        console.log(`\n  ${chalk.dim('Bye!')}\n`)
        rl.close()
        return
      }

      const cmdName = choiceMap[choice]
      if (cmdName && interactiveHandlers[cmdName]) {
        await interactiveHandlers[cmdName](rl)
      } else {
        console.log(`  ${chalk.red('Invalid choice, try again.')}\n`)
      }
      console.log('')
    }
  } finally {
    rl.close()
  }
}
