import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { exitWithError } from '../errors.js'
import { createHelp } from '../help-builder.js'
import { parseCommonFlags } from '../parse-flags.js'
import { ask, isBack, pauseWithCopy, captureOutput } from '../interactive-utils.js'
import type { Command } from './types.js'

/** Normalize a MAC address to colon-separated uppercase. Returns null if invalid. */
function normalizeMac(input: string): string | null {
  // Strip common separators and whitespace
  const cleaned = input.replace(/[-:.\s]/g, '').toUpperCase()
  if (!/^[0-9A-F]{12}$/.test(cleaned)) return null
  return cleaned
}

function formatMac(hex: string, format: string): string {
  switch (format) {
    case 'colon':
      return hex.replace(/(.{2})(?=.)/g, '$1:')
    case 'hyphen':
      return hex.replace(/(.{2})(?=.)/g, '$1-')
    case 'dot':
      return hex.replace(/(.{4})(?=.)/g, '$1.')
    case 'cisco':
      return hex.replace(/(.{4})(?=.)/g, '$1.')
    case 'unix':
      return hex.replace(/(.{2})(?=.)/g, '$1:').toLowerCase()
    default:
      return hex.replace(/(.{2})(?=.)/g, '$1:')
  }
}

export function mac(args: string[]) {
  const { flags, rest } = parseCommonFlags(args)
  const validFormats = ['colon', 'hyphen', 'dot', 'cisco', 'unix'] as const
  type MacFormat = (typeof validFormats)[number]
  const inputArgs: string[] = []

  let targetFormat: MacFormat | undefined
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]
    if (a === '--format') {
      const raw = rest[i + 1] as MacFormat | undefined
      if (!raw || !validFormats.includes(raw)) {
        exitWithError(`unsupported format "${raw}" (supported: ${validFormats.join(', ')})`)
      }
      targetFormat = raw
      i++
      continue
    }
    inputArgs.push(a)
  }

  const input = inputArgs.join(' ').trim()
  if (!input) {
    exitWithError('provide a MAC address')
  }

  const hex = normalizeMac(input)
  if (!hex) {
    exitWithError(`invalid MAC address "${input}"`)
    return
  }

  if (flags.json) {
    console.log(
      JSON.stringify({
        input,
        normalized: formatMac(hex, 'colon'),
        formats: Object.fromEntries(validFormats.map((f) => [f, formatMac(hex, f)])),
      }),
    )
    return
  }

  if (targetFormat) {
    console.log(formatMac(hex, targetFormat))
    return
  }

  console.log('')
  console.log(`  ${chalk.bold('MAC Address')}`)
  console.log(`  ${chalk.dim('───────────')}`)
  console.log(`  ${chalk.dim('colon:')}  ${chalk.green(formatMac(hex, 'colon'))}`)
  console.log(`  ${chalk.dim('hyphen:')} ${chalk.green(formatMac(hex, 'hyphen'))}`)
  console.log(`  ${chalk.dim('dot:')}    ${chalk.green(formatMac(hex, 'dot'))}`)
  console.log(`  ${chalk.dim('cisco:')}  ${chalk.green(formatMac(hex, 'cisco'))}`)
  console.log(`  ${chalk.dim('unix:')}   ${chalk.green(formatMac(hex, 'unix'))}`)
  console.log('')
}

const macHelp = createHelp({
  name: 'mac',
  description: 'Format and validate MAC addresses',
  usage: 'dt mac <address> [options]',
  options: [{ flags: '--format <fmt>', desc: 'Output format (colon/hyphen/dot/cisco/unix)' }],
  extra: [
    `  ${chalk.yellow('Formats:')}`,
    '    colon   aa:bb:cc:dd:ee:ff (default)',
    '    hyphen  aa-bb-cc-dd-ee-ff',
    '    dot     aabb.ccdd.eeff',
    '    cisco   aabb.ccdd.eeff (same as dot)',
    '    unix    aa:bb:cc:dd:ee:ff (lowercase)',
    '',
  ],
  examples: [
    { cmd: 'dt mac aa:bb:cc:dd:ee:ff' },
    { cmd: 'dt mac AA-BB-CC-DD-EE-FF --format cisco' },
    { cmd: 'dt mac aabb.ccdd.eeff' },
  ],
})

async function macInteractive(rl: ReturnType<typeof createInterface>): Promise<void> {
  const input = await ask(rl, `  ${chalk.yellow('?')} MAC address: `)
  if (isBack(input)) return
  const format = (
    await ask(
      rl,
      `  ${chalk.yellow('?')} Format ${chalk.dim('(colon/hyphen/dot/cisco/unix)')} ${chalk.dim('[colon]')}: `,
    )
  )
    .trim()
    .toLowerCase()
  if (isBack(format)) return
  const output = captureOutput(() => mac(input ? (format ? [input, '--format', format] : [input]) : []))
  await pauseWithCopy(rl, output)
}

export const macCommand: Command = {
  name: 'mac',
  aliases: [],
  category: 'network',
  description: 'Format and validate MAC addresses',
  run: mac,
  help: macHelp,
  interactive: macInteractive,
}
