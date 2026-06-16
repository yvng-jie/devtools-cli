import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { readStdinSync } from '../utils.js'
import { exitWithError } from '../errors.js'
import { createHelp } from '../help-builder.js'
import { parseCommonFlags } from '../parse-flags.js'
import { ask, isBack, pauseWithCopy, captureOutput } from '../interactive-utils.js'
import type { Command } from './types.js'

interface SemVer {
  major: number
  minor: number
  patch: number
  pre: string[]
  build: string[]
}

const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)(-[\da-zA-Z.-]+)?(\+[\da-zA-Z.-]+)?$/

function parseSemver(v: string): SemVer | null {
  const m = v.match(SEMVER_RE)
  if (!m) return null
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    pre: m[4] ? m[4].slice(1).split('.') : [],
    build: m[5] ? m[5].slice(1).split('.') : [],
  }
}

function formatSemver(sv: SemVer): string {
  let v = `${sv.major}.${sv.minor}.${sv.patch}`
  if (sv.pre.length > 0) v += '-' + sv.pre.join('.')
  if (sv.build.length > 0) v += '+' + sv.build.join('.')
  return v
}

function compareSemver(a: SemVer, b: SemVer): number {
  if (a.major !== b.major) return a.major - b.major
  if (a.minor !== b.minor) return a.minor - b.minor
  if (a.patch !== b.patch) return a.patch - b.patch

  // Pre-release: has pre-release < no pre-release
  const aPre = a.pre.length > 0
  const bPre = b.pre.length > 0
  if (!aPre && bPre) return 1
  if (aPre && !bPre) return -1
  if (!aPre && !bPre) return 0

  // Compare pre-release identifiers
  const len = Math.max(a.pre.length, b.pre.length)
  for (let i = 0; i < len; i++) {
    const ai = a.pre[i]
    const bi = b.pre[i]
    if (ai === undefined) return -1
    if (bi === undefined) return 1

    const an = Number(ai)
    const bn = Number(bi)
    const aIsNum = !Number.isNaN(an)
    const bIsNum = !Number.isNaN(bn)

    if (aIsNum && bIsNum) {
      if (an !== bn) return an - bn
    } else if (aIsNum !== bIsNum) {
      return aIsNum ? -1 : 1 // numeric < string
    } else {
      if (ai !== bi) return ai < bi ? -1 : 1
    }
  }
  return 0
}

function bump(sv: SemVer, part: 'major' | 'minor' | 'patch'): SemVer {
  switch (part) {
    case 'major': return { major: sv.major + 1, minor: 0, patch: 0, pre: [], build: [] }
    case 'minor': return { major: sv.major, minor: sv.minor + 1, patch: 0, pre: [], build: [] }
    case 'patch': return { major: sv.major, minor: sv.minor, patch: sv.patch + 1, pre: [], build: [] }
  }
}

function releaseType(sv: SemVer): string {
  if (sv.major === 0) return 'initial development'
  if (sv.pre.length > 0) return 'pre-release'
  return 'stable'
}

export function semver(args: string[]) {
  const { flags, rest } = parseCommonFlags(args)

  let bumpPart: 'major' | 'minor' | 'patch' | null = null
  let compareTarget: string | null = null
  let validateOnly = false
  const inputArgs: string[] = []
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]
    if (a === '--major') bumpPart = 'major'
    else if (a === '--minor') bumpPart = 'minor'
    else if (a === '--patch') bumpPart = 'patch'
    else if (a === '--compare') {
      compareTarget = rest[i + 1]
      i++
    } else if (a === '--validate') validateOnly = true
    else inputArgs.push(a)
  }

  const raw = inputArgs.join(' ') || readStdinSync()
  if (!raw) {
    exitWithError('provide a semver string (e.g. "1.2.3" or "1.2.3-beta.1")')
  }

  const parsed = parseSemver(raw)
  const sv: SemVer = parsed!

  if (!parsed) {
    if (validateOnly) {
      exitWithError('invalid semver')
    }
    exitWithError(`"${raw}" is not a valid semver (expected format: X.Y.Z[-pre][+build])`)
  }

  if (validateOnly) {
    console.log(chalk.green('✓ Valid semver'))
    return
  }

  // Compare mode
  if (compareTarget) {
    const other = parseSemver(compareTarget)
    if (!other) exitWithError(`"${compareTarget}" is not a valid semver`)
    const cmp = compareSemver(sv, other!)
    if (flags.json) {
      console.log(JSON.stringify({ a: raw, b: compareTarget, result: cmp }))
      return
    }
    if (cmp < 0) console.log(`${chalk.green(raw)} < ${chalk.white(compareTarget)}`)
    else if (cmp > 0) console.log(`${chalk.green(raw)} > ${chalk.white(compareTarget)}`)
    else console.log(`${chalk.green(raw)} == ${chalk.white(compareTarget)}`)
    return
  }

  // Bump mode
  if (bumpPart) {
    const bumped = bump(sv, bumpPart)
    const result = formatSemver(bumped)
    if (flags.json) {
      console.log(JSON.stringify({ input: raw, action: `bump-${bumpPart}`, result }))
      return
    }
    console.log(chalk.green(result))
    return
  }

  // Default: parse & display
  if (flags.json) {
    console.log(JSON.stringify({
      input: raw,
      major: sv.major,
      minor: sv.minor,
      patch: sv.patch,
      pre: sv.pre.length > 0 ? sv.pre.join('.') : null,
      build: sv.build.length > 0 ? sv.build.join('.') : null,
      release: releaseType(sv),
    }))
    return
  }

  console.log('')
  console.log(`  ${chalk.bold('Semantic Version')}`)
  console.log(`  ${chalk.dim('─────────────────')}`)
  console.log(`  ${chalk.dim('Input:')}    ${chalk.white(raw)}`)
  console.log(`  ${chalk.dim('Major:')}    ${chalk.cyan(String(sv.major))}`)
  console.log(`  ${chalk.dim('Minor:')}    ${chalk.cyan(String(sv.minor))}`)
  console.log(`  ${chalk.dim('Patch:')}    ${chalk.cyan(String(sv.patch))}`)
  if (sv.pre.length > 0) console.log(`  ${chalk.dim('Pre:')}      ${chalk.yellow(sv.pre.join('.'))}`)
  if (sv.build.length > 0) console.log(`  ${chalk.dim('Build:')}    ${chalk.yellow(sv.build.join('.'))}`)
  console.log(`  ${chalk.dim('Release:')}  ${chalk.green(releaseType(sv))}`)
  console.log('')
}

const semverHelp = createHelp({
  name: 'semver',
  description: 'Parse, validate, compare, and bump semantic versions',
  usage: 'dt semver <version> [options]',
  options: [
    { flags: '--major', desc: 'Bump major version (X.0.0)' },
    { flags: '--minor', desc: 'Bump minor version (0.X.0)' },
    { flags: '--patch', desc: 'Bump patch version (0.0.X)' },
    { flags: '--compare <version>', desc: 'Compare with another version' },
    { flags: '--validate', desc: 'Validate semver string only' },
  ],
  examples: [
    { cmd: 'dt semver "1.2.3"' },
    { cmd: 'dt semver "1.2.3-beta.1"' },
    { cmd: 'dt semver "1.2.3" --major' },
    { cmd: 'dt semver "1.2.3" --minor' },
    { cmd: 'dt semver "1.2.3" --compare "2.0.0"' },
    { cmd: 'dt semver "1.2.3" --validate' },
    { cmd: 'echo "1.2.3" | dt semver --patch' },
  ],
})

async function semverInteractive(rl: ReturnType<typeof createInterface>): Promise<void> {
  const input = await ask(rl, `  ${chalk.yellow('?')} Semver version (e.g. 1.2.3 or 1.2.3-beta.1): `)
  if (isBack(input)) return
  const output = captureOutput(() => semver(input ? [input] : []))
  await pauseWithCopy(rl, output)
}

export const semverCommand: Command = {
  name: 'semver',
  aliases: ['sv'],
  category: 'utility',
  description: 'Parse, validate, compare, and bump semantic versions',
  run: semver,
  help: semverHelp,
  interactive: semverInteractive,
}
