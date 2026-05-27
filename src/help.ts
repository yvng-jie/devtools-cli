import chalk from 'chalk'

const HEADER = `
${chalk.bold.cyan('  █▀▄ █▀▀ █░█ ▀█▀ █▀█ █▀█ █░░ █▀   █▀▀ █░░ █')}
${chalk.bold.cyan('  █▄▀ ██▀ ▀▄▀ ░█░ █▄█ █▄█ █▄▄ ▄█   █▄▄ █▄▄ █')}
${chalk.dim('  ─────────────────────────────────────────')}
`

export function showHelp() {
  console.log(HEADER)
  console.log(`  ${chalk.bold('Handy developer tools for your terminal.')}`)
  console.log('')
  console.log(`  ${chalk.yellow('Usage:')}`)
  console.log(`    dt ${chalk.dim('<command>')} ${chalk.dim('[options]')}`)
  console.log('')
  console.log(`  ${chalk.yellow('Commands:')}`)
  console.log(`    ${chalk.green('uuid')}        ${chalk.dim('Generate random UUID v4')}`)
  console.log(`    ${chalk.green('base64')}      ${chalk.dim('Encode or decode Base64')}`)
  console.log(`    ${chalk.green('color')}       ${chalk.dim('Convert colors (HEX / RGB / HSL / named)')}`)
  console.log(`    ${chalk.green('jwt')}         ${chalk.dim('Decode a JWT token')}`)
  console.log(`    ${chalk.green('hash')}        ${chalk.dim('Generate SHA hashes')}`)
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
  console.log(`    echo "hello" | dt base64 encode`)
  console.log('')
  console.log(`  ${chalk.dim('MIT License · github.com/yvng-jie/devtools-cli')}`)
  console.log(`  ${chalk.dim('Run')} ${chalk.cyan('dt')} ${chalk.dim('with no args for interactive mode.')}`)
  console.log('')
}

export function showVersion() {
  console.log('dt v0.1.0')
}
