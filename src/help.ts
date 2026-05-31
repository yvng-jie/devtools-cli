import chalk from 'chalk'
import { version } from '../package.json'
import type { Command } from './commands/types.js'

const HEADER = `
${chalk.bold.cyan('  █▀▄ █▀▀ █░█ ▀█▀ █▀█ █▀█ █░░ █▀   █▀▀ █░░ █')}
${chalk.bold.cyan('  █▄▀ ██▀ ▀▄▀ ░█░ █▄█ █▄█ █▄▄ ▄█   █▄▄ █▄▄ █')}
${chalk.dim('  ─────────────────────────────────────────')}
`

export function showHelp(cmds?: Command[]) {
  console.log(HEADER)
  console.log(`  ${chalk.bold('Handy developer tools for your terminal.')}`)
  console.log('')
  console.log(`  ${chalk.yellow('Usage:')}`)
  console.log(`    dt ${chalk.dim('<command>')} ${chalk.dim('[options]')}`)
  console.log('')
  console.log(`  ${chalk.yellow('Commands:')}`)
  if (cmds) {
    for (const cmd of cmds) {
      const names =
        cmd.aliases.length > 0 ? `${chalk.green(cmd.name)} / ${chalk.green(cmd.aliases[0])}` : chalk.green(cmd.name)
      console.log(`    ${names.padEnd(22)} ${chalk.dim(cmd.description)}`)
    }
  }
  console.log(`    ${chalk.green('help')}        ${chalk.dim('Show this help')}`)
  console.log('')
  console.log(`  ${chalk.yellow('Examples:')}`)
  console.log(`    dt uuid`)
  console.log(`    dt uuid --count 5`)
  console.log(`    dt base64 encode "hello world"`)
  console.log(`    dt base64 decode "aGVsbG8="`)
  console.log(`    dt color "#ff7f50"`)
  console.log(`    dt color "rgb(255,127,80)"`)
  console.log(`    dt jwt "eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiSm9obiJ9.xxx"`)
  console.log(`    dt hash "hello" --algo sha256`)
  console.log(`    dt ts 1716806400`)
  console.log(`    echo "hello" | dt base64 encode`)
  console.log('')
  console.log(`  ${chalk.dim('MIT License · github.com/yvng-jie/devtools-cli')}`)
  console.log(`  ${chalk.dim('Run')} ${chalk.cyan('dt')} ${chalk.dim('with no args for interactive mode.')}`)
  console.log('')
}

export function showVersion() {
  console.log(`devkits v${version} (dt)`)
}
