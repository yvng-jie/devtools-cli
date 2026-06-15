import { createInterface } from 'node:readline'
import chalk from 'chalk'
import { exitWithError } from '../errors.js'
import { createHelp } from '../help-builder.js'
import { parseCommonFlags } from '../parse-flags.js'
import { ask, isBack, pauseWithCopy, captureOutput } from '../interactive-utils.js'
import type { Command } from './types.js'

const MATH_FUNCTIONS: Record<string, (...args: number[]) => number> = {
  sqrt: Math.sqrt,
  abs: Math.abs,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  pow: Math.pow,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  log: Math.log,
  log2: Math.log2,
  log10: Math.log10,
  exp: Math.exp,
  max: Math.max,
  min: Math.min,
}

const MATH_CONSTANTS: Record<string, number> = {
  PI: Math.PI,
  E: Math.E,
  LN2: Math.LN2,
  LN10: Math.LN10,
  SQRT2: Math.SQRT2,
}

function safeEval(expression: string, precision: number): number {
  const sanitized = expression.replace(/\^/g, '**').replace(/[^0-9+\-*/.()%\s,a-zA-Z]/g, '')
  if (!sanitized.trim()) {
    exitWithError('invalid expression — only numbers, operators, and math functions allowed')
  }

  const sandbox: Record<string, unknown> = {
    ...MATH_CONSTANTS,
    ...MATH_FUNCTIONS,
  }

  const funcBody = `
    const { ${Object.keys(MATH_FUNCTIONS).join(', ')} } = arguments[0];
    const { ${Object.keys(MATH_CONSTANTS).join(', ')} } = arguments[0];
    return (${sanitized});
  `

  try {
    const fn = new Function(funcBody)
    const result = fn(sandbox)
    const factor = Math.pow(10, precision)
    return Math.round(result * factor) / factor
  } catch {
    exitWithError(`could not evaluate "${expression}"`)
    return NaN
  }
}

export function math(args: string[]) {
  const { flags, rest } = parseCommonFlags(args)

  const precisionIdx = rest.indexOf('--precision')
  let precision = 10
  if (precisionIdx >= 0) {
    precision = Number(rest[precisionIdx + 1]) || 10
    rest.splice(precisionIdx, 2)
  }

  const expression = rest.join(' ').trim()
  if (!expression) {
    exitWithError('provide a mathematical expression (e.g. "sqrt(16) * 3")')
  }

  const result = safeEval(expression, precision)

  if (flags.json) {
    console.log(JSON.stringify({ expression, result, precision }))
    return
  }

  console.log('')
  console.log(`  ${chalk.dim('Expression:')}  ${chalk.white(expression)}`)
  console.log(`  ${chalk.dim('Result:')}      ${chalk.green(String(result))}`)
  console.log('')
}

const mathHelp = createHelp({
  name: 'math',
  description: 'Evaluate mathematical expressions',
  usage: 'dt math <expression>',
  options: [
    { flags: '--precision <n>', desc: 'Decimal places (default: 10)' },
  ],
  extra: [
    `  ${chalk.yellow('Functions:')}`,
    '    sqrt, abs, round, floor, ceil, pow, sin, cos, tan',
    '    asin, acos, atan, log, log2, log10, exp, max, min',
    '',
    `  ${chalk.yellow('Constants:')}`,
    '    PI, E, LN2, LN10, SQRT2',
    '',
  ],
  examples: [
    { cmd: 'dt math "sqrt(16) * 3"' },
    { cmd: 'dt math "2^10"' },
    { cmd: 'dt math "sin(PI/2)"' },
    { cmd: 'dt math "100 / 3" --precision 4' },
  ],
})

async function mathInteractive(rl: ReturnType<typeof createInterface>): Promise<void> {
  const expr = await ask(rl, `  ${chalk.yellow('?')} Expression ${chalk.dim('(e.g. sqrt(16)*3)')}: `)
  if (isBack(expr)) return
  const output = captureOutput(() => math(expr ? [expr] : []))
  await pauseWithCopy(rl, output)
}

export const mathCommand: Command = {
  name: 'math',
  aliases: [],
  category: 'math',
  description: 'Evaluate mathematical expressions',
  run: math,
  help: mathHelp,
  interactive: mathInteractive,
}
