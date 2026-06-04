import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { exitWithError } from '../errors.js'
import { createHelp } from '../help-builder.js'
import { parseCommonFlags } from '../parse-flags.js'
import { ask, isBack, pauseWithCopy, captureOutputAsync } from '../interactive-utils.js'
import type { Command } from './types.js'

interface IpInfo {
  ip: string
  city?: string
  region?: string
  country?: string
  countryCode?: string
  isp?: string
  org?: string
  timezone?: string
  lat?: number
  lon?: number
}

/** Fetch IP info from ip-api.com (free, no API key needed). */
async function fetchIpInfo(targetIp?: string): Promise<IpInfo> {
  const query = targetIp || ''
  const url = `https://ip-api.com/json/${query}?fields=query,city,region,country,countryCode,isp,org,timezone,lat,lon`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`)
  }

  const data = await response.json()
  if (data.status === 'fail') {
    throw new Error(`invalid IP address: "${targetIp}"`)
  }

  return {
    ip: data.query,
    city: data.city,
    region: data.region,
    country: data.country,
    countryCode: data.countryCode,
    isp: data.isp,
    org: data.org,
    timezone: data.timezone,
    lat: data.lat,
    lon: data.lon,
  }
}

export async function ip(args: string[]) {
  const { flags, rest } = parseCommonFlags(args)

  const targetIp = rest.join(' ').trim() || undefined

  try {
    const info = await fetchIpInfo(targetIp)

    if (flags.json) {
      console.log(JSON.stringify(info))
      return
    }

    console.log('')
    console.log(`  ${chalk.bold('🌐 IP Information')}`)
    console.log(`  ${chalk.dim('────────────────')}`)
    console.log(`  ${chalk.dim('IP:')}         ${chalk.green(info.ip)}`)
    if (info.city) console.log(`  ${chalk.dim('City:')}       ${chalk.white(info.city)}`)
    if (info.region) console.log(`  ${chalk.dim('Region:')}     ${chalk.white(info.region)}`)
    if (info.country)
      console.log(
        `  ${chalk.dim('Country:')}    ${chalk.white(`${info.country} ${info.countryCode ? `(${info.countryCode})` : ''}`)}`,
      )
    if (info.isp) console.log(`  ${chalk.dim('ISP:')}        ${chalk.white(info.isp)}`)
    if (info.org) console.log(`  ${chalk.dim('Org:')}        ${chalk.white(info.org)}`)
    if (info.timezone) console.log(`  ${chalk.dim('Timezone:')}   ${chalk.white(info.timezone)}`)
    if (info.lat != null && info.lon != null)
      console.log(`  ${chalk.dim('Location:')}   ${chalk.white(`${info.lat}, ${info.lon}`)}`)
    console.log('')
  } catch (err) {
    exitWithError((err as Error).message)
  }
}

const ipHelp = createHelp({
  name: 'ip',
  description: 'Look up IP address information & geolocation',
  usage: 'dt ip [address]',
  examples: [
    { cmd: 'dt ip', desc: 'Your public IP & info' },
    { cmd: 'dt ip 8.8.8.8', desc: 'Look up a specific IP' },
  ],
})

async function ipInteractive(rl: ReturnType<typeof createInterface>): Promise<void> {
  const input = await ask(rl, `  ${chalk.yellow('?')} IP address ${chalk.dim('(or Enter for your public IP)')}: `)
  if (isBack(input)) return
  const output = await captureOutputAsync(() => ip(input ? [input] : []))
  await pauseWithCopy(rl, output)
}

export const ipCommand: Command = {
  name: 'ip',
  aliases: [],
  category: 'network',
  description: 'Look up IP address information & geolocation',
  run: ip,
  help: ipHelp,
  interactive: ipInteractive,
}
