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
  hostname?: string
  postal?: string
}

const countryNames: Record<string, string> = {
  AF: 'Afghanistan', AL: 'Albania', DZ: 'Algeria', AD: 'Andorra', AO: 'Angola',
  AR: 'Argentina', AM: 'Armenia', AU: 'Australia', AT: 'Austria', AZ: 'Azerbaijan',
  BD: 'Bangladesh', BY: 'Belarus', BE: 'Belgium', BO: 'Bolivia', BA: 'Bosnia and Herzegovina',
  BR: 'Brazil', BN: 'Brunei', BG: 'Bulgaria', KH: 'Cambodia', CA: 'Canada',
  CL: 'Chile', CN: 'China', CO: 'Colombia', CR: 'Costa Rica', HR: 'Croatia',
  CU: 'Cuba', CY: 'Cyprus', CZ: 'Czech Republic', DK: 'Denmark', DO: 'Dominican Republic',
  EC: 'Ecuador', EG: 'Egypt', SV: 'El Salvador', EE: 'Estonia', ET: 'Ethiopia',
  FI: 'Finland', FR: 'France', GE: 'Georgia', DE: 'Germany', GH: 'Ghana',
  GR: 'Greece', GT: 'Guatemala', HK: 'Hong Kong', HU: 'Hungary', IS: 'Iceland',
  IN: 'India', ID: 'Indonesia', IR: 'Iran', IQ: 'Iraq', IE: 'Ireland',
  IL: 'Israel', IT: 'Italy', JM: 'Jamaica', JP: 'Japan', JO: 'Jordan',
  KZ: 'Kazakhstan', KE: 'Kenya', KR: 'South Korea', KW: 'Kuwait', KG: 'Kyrgyzstan',
  LA: 'Laos', LV: 'Latvia', LB: 'Lebanon', LI: 'Liechtenstein', LT: 'Lithuania',
  LU: 'Luxembourg', MO: 'Macau', MG: 'Madagascar', MY: 'Malaysia', MV: 'Maldives',
  MT: 'Malta', MX: 'Mexico', MC: 'Monaco', MN: 'Mongolia', ME: 'Montenegro',
  MA: 'Morocco', MM: 'Myanmar', NP: 'Nepal', NL: 'Netherlands', NZ: 'New Zealand',
  NI: 'Nicaragua', NG: 'Nigeria', KP: 'North Korea', MK: 'North Macedonia', NO: 'Norway',
  OM: 'Oman', PK: 'Pakistan', PA: 'Panama', PY: 'Paraguay', PE: 'Peru',
  PH: 'Philippines', PL: 'Poland', PT: 'Portugal', PR: 'Puerto Rico', QA: 'Qatar',
  RO: 'Romania', RU: 'Russia', SA: 'Saudi Arabia', RS: 'Serbia', SG: 'Singapore',
  SK: 'Slovakia', SI: 'Slovenia', ZA: 'South Africa', ES: 'Spain', LK: 'Sri Lanka',
  SD: 'Sudan', SE: 'Sweden', CH: 'Switzerland', SY: 'Syria', TW: 'Taiwan',
  TJ: 'Tajikistan', TZ: 'Tanzania', TH: 'Thailand', TT: 'Trinidad and Tobago',
  TN: 'Tunisia', TR: 'Turkey', TM: 'Turkmenistan', UG: 'Uganda', UA: 'Ukraine',
  AE: 'United Arab Emirates', GB: 'United Kingdom', US: 'United States',
  UY: 'Uruguay', UZ: 'Uzbekistan', VE: 'Venezuela', VN: 'Vietnam', YE: 'Yemen',
  ZM: 'Zambia', ZW: 'Zimbabwe',
}

/** Fetch IP info from ipinfo.io (free tier, 50k req/month, no API key needed). */
async function fetchIpInfo(targetIp?: string): Promise<IpInfo> {
  const query = targetIp || ''
  const url = `https://ipinfo.io/${query}`

  const response = await fetch(url, {
    signal: AbortSignal.timeout(5000),
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error(`API returned ${response.status}${response.status === 403 ? ' — rate limited or blocked' : ''}`)
  }

  const data = await response.json()
  if (data.error || data.status === 404) {
    throw new Error(`invalid IP address: "${targetIp}"`)
  }

  const [lat, lon] = (data.loc as string | undefined)?.split(',').map(Number) ?? []

  return {
    ip: data.ip,
    city: data.city,
    region: data.region,
    countryCode: data.country,
    country: data.country ? (countryNames[data.country] ?? data.country) : undefined,
    isp: data.org,
    org: data.org,
    timezone: data.timezone,
    lat,
    lon,
    hostname: data.hostname,
    postal: data.postal,
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
    if (info.hostname) console.log(`  ${chalk.dim('Hostname:')}   ${chalk.white(info.hostname)}`)
    if (info.city) console.log(`  ${chalk.dim('City:')}       ${chalk.white(info.city)}`)
    if (info.region) console.log(`  ${chalk.dim('Region:')}     ${chalk.white(info.region)}`)
    if (info.country)
      console.log(
        `  ${chalk.dim('Country:')}    ${chalk.white(`${info.country} ${info.countryCode ? `(${info.countryCode})` : ''}`)}`,
      )
    if (info.postal) console.log(`  ${chalk.dim('Postal:')}     ${chalk.white(info.postal)}`)
    if (info.isp) console.log(`  ${chalk.dim('ISP:')}        ${chalk.white(info.isp)}`)
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
