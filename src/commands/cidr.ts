import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { exitWithError } from '../errors.js'
import { createHelp } from '../help-builder.js'
import { parseCommonFlags } from '../parse-flags.js'
import { ask, isBack, pauseWithCopy, captureOutput } from '../interactive-utils.js'
import type { Command } from './types.js'

interface NetworkInfo {
  address: string
  mask: string
  cidr: number
  network: string
  broadcast: string
  hostMin: string
  hostMax: string
  totalHosts: number
}

function parseCidr(input: string): NetworkInfo | null {
  const match = input.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)\/(\d+)$/)
  if (!match) return null

  const octets = [Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4])]
  const cidr = Number(match[5])

  if (octets.some((o) => o < 0 || o > 255) || cidr < 0 || cidr > 32) return null

  const maskInt = cidr === 0 ? 0 : (~0 >>> 0) << (32 - cidr)
  const maskOctets = [(maskInt >>> 24) & 0xff, (maskInt >>> 16) & 0xff, (maskInt >>> 8) & 0xff, maskInt & 0xff]

  const addrInt = ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0
  const networkInt = addrInt & maskInt
  const broadcastInt = (networkInt | ~maskInt) >>> 0

  const toOctets = (n: number): string => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join('.')

  const hostCount = cidr === 0 ? 0x100000000 : cidr >= 31 ? (cidr === 32 ? 1 : 2) : 1 << (32 - cidr)
  const totalHosts = cidr === 0 ? hostCount - 2 : cidr >= 31 ? hostCount : hostCount - 2

  return {
    address: octets.join('.'),
    mask: maskOctets.join('.'),
    cidr,
    network: toOctets(networkInt),
    broadcast: toOctets(broadcastInt),
    hostMin: toOctets(cidr >= 31 ? networkInt : networkInt + 1),
    hostMax: toOctets(cidr >= 31 ? broadcastInt : broadcastInt - 1),
    totalHosts,
  }
}

export function cidr(args: string[]) {
  const { flags, rest } = parseCommonFlags(args)

  const input = rest.join('').trim()
  if (!input) {
    exitWithError('provide a CIDR notation (e.g. 192.168.1.0/24)')
  }

  const info = parseCidr(input)
  if (!info) {
    exitWithError(`invalid CIDR "${input}" — expected format: 192.168.1.0/24`)
    return
  }

  if (flags.json) {
    console.log(JSON.stringify(info))
    return
  }

  console.log('')
  console.log(`  ${chalk.bold('CIDR Block')}   ${chalk.green(`${info.address}/${info.cidr}`)}`)
  console.log(`  ${chalk.dim('────────────────────────────────')}`)
  console.log(`  ${chalk.dim('Network:')}     ${chalk.white(info.network)}`)
  console.log(`  ${chalk.dim('Broadcast:')}   ${chalk.white(info.broadcast)}`)
  console.log(`  ${chalk.dim('Subnet Mask:')} ${chalk.white(info.mask)}`)
  console.log(`  ${chalk.dim('Host Range:')}  ${chalk.white(`${info.hostMin} — ${info.hostMax}`)}`)
  console.log(`  ${chalk.dim('Total Hosts:')} ${chalk.yellow(String(info.totalHosts))}`)
  console.log('')
}

const cidrHelp = createHelp({
  name: 'cidr',
  description: 'CIDR/IP calculator (network, broadcast, subnet mask, host range)',
  usage: 'dt cidr <cidr>',
  examples: [
    { cmd: 'dt cidr 192.168.1.0/24' },
    { cmd: 'dt cidr 10.0.0.0/8' },
    { cmd: 'dt cidr 172.16.0.0/12' },
  ],
})

async function cidrInteractive(rl: ReturnType<typeof createInterface>): Promise<void> {
  const input = await ask(rl, `  ${chalk.yellow('?')} CIDR notation ${chalk.dim('(e.g. 192.168.1.0/24)')}: `)
  if (isBack(input)) return
  const output = captureOutput(() => cidr(input ? [input] : []))
  await pauseWithCopy(rl, output)
}

export const cidrCommand: Command = {
  name: 'cidr',
  aliases: [],
  category: 'network',
  description: 'CIDR/IP calculator (network, broadcast, subnet mask, host range)',
  run: cidr,
  help: cidrHelp,
  interactive: cidrInteractive,
}
