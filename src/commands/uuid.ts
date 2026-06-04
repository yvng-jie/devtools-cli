import { randomUUID, randomBytes } from 'node:crypto'
import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { exitWithError } from '../errors.js'
import { createHelp } from '../help-builder.js'
import { parseCommonFlags } from '../parse-flags.js'
import { ask, isBack, pauseWithCopy, captureOutput } from '../interactive-utils.js'
import type { Command } from './types.js'

const VERSIONS = ['1', '4', '7'] as const
type Version = (typeof VERSIONS)[number]

/** Generate a UUID v1 (time-based). */
function uuidV1(): string {
  // UUID epoch is Oct 15, 1582. Diff from Unix epoch (Jan 1, 1970) in 100ns intervals
  const uuidEpoch = 0x01b21dd213814000n
  const now = BigInt(Date.now()) * 10000n + uuidEpoch

  const timeLow = Number(now & 0xffffffffn)
  const timeMid = Number((now >> 32n) & 0xffffn)
  const timeHi = Number((now >> 48n) & 0x0fffn) | 0x1000 // version 1

  const clockSeq = randomBytes(2)
  clockSeq[0] = (clockSeq[0]! & 0x3f) | 0x80 // variant 10xx

  const node = randomBytes(6)
  node[0] = (node[0]! & 0xfe) | 0x02 // multicast bit

  const hex = (n: number, len: number) => n.toString(16).padStart(len, '0')
  const buf = (b: Buffer) => b.toString('hex')

  return `${hex(timeLow, 8)}-${hex(timeMid, 4)}-${hex(timeHi, 4)}-${buf(clockSeq)}-${buf(node)}`
}

/** Generate a UUID v7 (time-ordered). */
function uuidV7(): string {
  const now = Date.now()
  const rand = randomBytes(10)

  // 48 bits timestamp ms
  const tsHex = now.toString(16).padStart(12, '0')

  // 4 bits version (7) + 12 bits random
  rand[0] = (rand[0]! & 0x0f) | 0x70

  // 2 bits variant (10) + 6 bits random
  rand[2] = (rand[2]! & 0x3f) | 0x80

  const r = rand.toString('hex')
  return `${tsHex.slice(0, 8)}-${tsHex.slice(8, 12)}-${r.slice(0, 4)}-${r.slice(4, 8)}-${r.slice(8, 20)}`
}

/** Parse flags from args. */
function parseUuidFlags(args: string[]): { json: boolean; count: number; version: Version } {
  const { flags, rest } = parseCommonFlags(args)
  let count = 1
  let version: Version = '4'

  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]
    if (a === '--count' || a === '-c') {
      const raw = rest[i + 1]
      const parsed = Number(raw)
      if (raw === undefined || !Number.isInteger(parsed) || parsed < 1) {
        exitWithError('--count must be a positive integer')
      }
      count = Math.min(parsed, 100)
      i++
      continue
    }
    if (a === '--version' || a === '-v') {
      const raw = rest[i + 1]
      if (raw && VERSIONS.includes(raw as Version)) {
        version = raw as Version
      } else {
        exitWithError(`unsupported UUID version "${raw}" (supported: ${VERSIONS.join(', ')})`)
      }
      i++
      continue
    }
  }

  return { json: flags.json, count, version }
}

export function uuid(args: string[]) {
  const { json: jsonMode, count, version } = parseUuidFlags(args)

  const uuids = Array.from({ length: count }, () => {
    switch (version) {
      case '1':
        return uuidV1()
      case '7':
        return uuidV7()
      default:
        return randomUUID()
    }
  })

  if (jsonMode) {
    console.log(JSON.stringify({ version: `v${version}`, uuids }))
  } else {
    for (const id of uuids) {
      console.log(chalk.green(id))
    }
  }
}

const uuidHelp = createHelp({
  name: 'uuid',
  description: 'Generate UUIDs (v4, v1, v7)',
  usage: 'dt uuid [options]',
  options: [
    { flags: '--count, -c <n>', desc: 'Number of UUIDs to generate (default: 1, max: 100)' },
    { flags: '--version, -v <v>', desc: 'UUID version: 1 (time), 4 (random, default), 7 (time-ordered)' },
  ],
  examples: [{ cmd: 'dt uuid' }, { cmd: 'dt uuid --count 10' }, { cmd: 'dt uuid --version 7' }],
})

async function uuidInteractive(rl: ReturnType<typeof createInterface>): Promise<void> {
  const countRaw = (await ask(rl, `  ${chalk.yellow('?')} How many UUIDs? ${chalk.dim('(1)')}: `)).trim()
  if (isBack(countRaw)) return
  const output = captureOutput(() => uuid(countRaw ? ['--count', countRaw] : []))
  await pauseWithCopy(rl, output)
}

export const uuidCommand: Command = {
  name: 'uuid',
  aliases: [],
  category: 'utility',
  description: 'Generate UUIDs (v4, v1, v7)',
  run: uuid,
  help: uuidHelp,
  interactive: uuidInteractive,
}
