import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { commands } from './commands/index.js'
import { ask, isBack } from './interactive-utils.js'
import type { Command, CommandCategory } from './commands/types.js'

// ── Category registry ──────────────────────────────────────────
interface CategoryInfo {
  label: string
  icon: string
  color: (s: string) => string
}

const CATEGORIES: Record<CommandCategory, CategoryInfo> = {
  crypto: { label: 'Security & Crypto', icon: '\u{1F6E1}\uFE0F', color: (s) => chalk.hex('#FF6B6B')(s) },
  encoding: { label: 'Encoding', icon: '\u{1F524}', color: (s) => chalk.hex('#4ECDC4')(s) },
  network: { label: 'Network', icon: '\u{1F310}', color: (s) => chalk.hex('#45B7D1')(s) },
  data: { label: 'Data Processing', icon: '\u{1F4CB}', color: (s) => chalk.hex('#96CEB4')(s) },
  utility: { label: 'Utilities', icon: '\u{1F9F0}', color: (s) => chalk.hex('#FFD93D')(s) },
  math: { label: 'Mathematics', icon: '\u{1F522}', color: (s) => chalk.hex('#DDA0DD')(s) },
  media: { label: 'Media', icon: '\u{1F5BC}\uFE0F', color: (s) => chalk.hex('#87CEEB')(s) },
}

const CATEGORY_ORDER: CommandCategory[] = ['crypto', 'encoding', 'network', 'data', 'utility', 'math', 'media']

// ── Get commands in display order (grouped by category) ────────
function getCommandsInDisplayOrder(): Command[] {
  const grouped = new Map<CommandCategory, Command[]>()
  for (const cat of CATEGORY_ORDER) grouped.set(cat, [])
  for (const cmd of commands) {
    const group = grouped.get(cmd.category)
    if (group) group.push(cmd)
  }
  const result: Command[] = []
  for (const cat of CATEGORY_ORDER) {
    const cmds = grouped.get(cat)
    if (cmds) result.push(...cmds)
  }
  return result
}

// ── Build choice mapping (matching display order) ──────────────
function buildChoiceMap(): Record<string, string> {
  const map: Record<string, string> = {}
  const orderedCmds = getCommandsInDisplayOrder()
  for (const [i, cmd] of orderedCmds.entries()) {
    map[String(i + 1)] = cmd.name
    map[cmd.name] = cmd.name
    for (const alias of cmd.aliases) {
      map[alias] = cmd.name
    }
  }
  return map
}

// ── Display a group of commands ────────────────────────────────
function displayCommandGroup(cmds: Command[], startNum: number): number {
  let num = startNum
  for (const cmd of cmds) {
    const displayName = cmd.aliases[0] ?? cmd.name
    console.log(
      `    ${chalk.green(String(num)).padEnd(4)} ${chalk.cyan(displayName.padEnd(14))} ${chalk.dim('— ' + cmd.description)}`,
    )
    num++
  }
  return num
}

// ── Run a command by name ───────────────────────────────────────
async function runCommand(cmdName: string, rl: ReturnType<typeof createInterface>): Promise<void> {
  const cmd = commands.find((c) => c.name === cmdName)
  if (cmd?.interactive) {
    await cmd.interactive(rl)
  } else {
    console.log(`  ${chalk.red('No interactive mode for this command.')}\n`)
  }
}

// ── Interactive main loop ──────────────────────────────────────
export async function interactive() {
  console.log('')
  console.log(
    `  ${chalk.bold.cyan('\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510')}`,
  )
  console.log(
    `  ${chalk.bold.cyan('\u2502')}       ${chalk.bold('\uD83D\uDD27 DT \u2014 Developer Toolkit')}    ${chalk.bold.cyan('\u2502')}`,
  )
  console.log(
    `  ${chalk.bold.cyan('\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518')}`,
  )
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
      const orderedCmds = getCommandsInDisplayOrder()

      console.log(`  ${chalk.yellow('Select a command:')}`)
      console.log('')

      let num = 1
      for (const cat of CATEGORY_ORDER) {
        const cmds = orderedCmds.filter((c) => c.category === cat)
        if (cmds.length === 0) continue
        const info = CATEGORIES[cat]
        console.log(`  ${chalk.bold(info.color(`${info.icon}  ${info.label}`))}`)
        num = displayCommandGroup(cmds, num)
        console.log('')
      }

      console.log(`  ${chalk.red('0')}/${chalk.red('q')} Exit\t${chalk.yellow('s')}/${chalk.yellow('/')} Search`)
      console.log('')

      const totalCmds = orderedCmds.length
      let choice: string
      try {
        choice = (await ask(rl, `  ${chalk.yellow('?')} Choose ${chalk.dim(`[0-${totalCmds}, s, /]`)}: `))
          .trim()
          .toLowerCase()
      } catch {
        console.log(`\n  ${chalk.dim('Bye!')}\n`)
        return
      }

      if (choice === '0' || choice === 'q' || choice === 'quit' || choice === 'exit' || choice === '') {
        console.log(`\n  ${chalk.dim('Bye!')}\n`)
        rl.close()
        return
      }

      // ── Search mode ────────────────────────────────────────────
      if (choice === 's' || choice === '/') {
        const query = (await ask(rl, `  ${chalk.yellow('?')} Search commands: `)).trim().toLowerCase()
        if (isBack(query)) continue
        if (!query) {
          console.log(`  ${chalk.red('Please enter a search term.')}\n`)
          continue
        }

        const results = commands.filter(
          (cmd) =>
            cmd.name.includes(query) ||
            cmd.aliases.some((a) => a.includes(query)) ||
            cmd.description.toLowerCase().includes(query),
        )

        if (results.length === 0) {
          console.log(`  ${chalk.red(`No commands matching "${query}"`)}\n`)
          continue
        }

        console.log(`\n  ${chalk.yellow(`Search results for "${query}" (${results.length} found):`)}`)
        for (const [i, cmd] of results.entries()) {
          const displayName = cmd.aliases[0] ?? cmd.name
          const catInfo = CATEGORIES[cmd.category]
          console.log(
            `    ${chalk.green(String(i + 1)).padEnd(4)} ${chalk.cyan(displayName.padEnd(14))} ${chalk.dim('— ' + cmd.description)}  ${chalk.dim(catInfo.label)}`,
          )
        }
        console.log(`    ${chalk.red('0')}/${chalk.red('q')} Back`)
        console.log('')

        const subChoice = (await ask(rl, `  ${chalk.yellow('?')} Choose: `)).trim().toLowerCase()
        if (subChoice === '0' || subChoice === 'q' || subChoice === '' || isBack(subChoice)) continue

        const idx = Number(subChoice) - 1
        if (idx >= 0 && idx < results.length) {
          await runCommand(results[idx].name, rl)
        } else {
          console.log(`  ${chalk.red('Invalid choice.')}\n`)
        }
        continue
      }

      // ── Direct command execution ──────────────────────────────
      const cmdName = choiceMap[choice]
      if (cmdName) {
        await runCommand(cmdName, rl)
      } else {
        console.log(`  ${chalk.red('Invalid choice, try again.')}\n`)
      }
      console.log('')
    }
  } finally {
    rl.close()
  }
}
