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

type TokenType =
  | 'NUMBER' | 'PLUS' | 'MINUS' | 'STAR' | 'SLASH' | 'PERCENT' | 'POW'
  | 'LPAREN' | 'RPAREN' | 'COMMA'
  | 'IDENTIFIER' | 'EOF'

interface Token {
  type: TokenType
  value: string
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < input.length) {
    if (input[i] === ' ' || input[i] === '\t') { i++; continue }
    if ((input[i] >= '0' && input[i] <= '9') || input[i] === '.') {
      let num = ''
      while (i < input.length && ((input[i] >= '0' && input[i] <= '9') || input[i] === '.')) {
        num += input[i]; i++
      }
      tokens.push({ type: 'NUMBER', value: num })
      continue
    }
    if ((input[i] >= 'a' && input[i] <= 'z') || (input[i] >= 'A' && input[i] <= 'Z') || input[i] === '_') {
      let ident = ''
      while (i < input.length && ((input[i] >= 'a' && input[i] <= 'z') || (input[i] >= 'A' && input[i] <= 'Z') || (input[i] >= '0' && input[i] <= '9') || input[i] === '_')) {
        ident += input[i]; i++
      }
      tokens.push({ type: 'IDENTIFIER', value: ident })
      continue
    }
    if (i + 1 < input.length && input[i] === '*' && input[i + 1] === '*') {
      tokens.push({ type: 'POW', value: '**' }); i += 2; continue
    }
    switch (input[i]) {
      case '+': tokens.push({ type: 'PLUS', value: '+' }); i++; break
      case '-': tokens.push({ type: 'MINUS', value: '-' }); i++; break
      case '*': tokens.push({ type: 'STAR', value: '*' }); i++; break
      case '/': tokens.push({ type: 'SLASH', value: '/' }); i++; break
      case '%': tokens.push({ type: 'PERCENT', value: '%' }); i++; break
      case '^': tokens.push({ type: 'POW', value: '^' }); i++; break
      case '(': tokens.push({ type: 'LPAREN', value: '(' }); i++; break
      case ')': tokens.push({ type: 'RPAREN', value: ')' }); i++; break
      case ',': tokens.push({ type: 'COMMA', value: ',' }); i++; break
      default: return []
    }
  }
  tokens.push({ type: 'EOF', value: '' })
  return tokens
}

class Parser {
  private tokens: Token[]
  private pos: number

  constructor(tokens: Token[]) {
    this.tokens = tokens
    this.pos = 0
  }

  private peek(): Token {
    return this.tokens[this.pos]
  }

  private consume(type: TokenType): string {
    const token = this.tokens[this.pos]
    if (token.type !== type) {
      throw new Error(`expected ${type}, got ${token.type}`)
    }
    this.pos++
    return token.value
  }

  parse(): number {
    const result = this.expression()
    if (this.peek().type !== 'EOF') {
      throw new Error('unexpected tokens after expression')
    }
    return result
  }

  private expression(): number {
    let left = this.term()
    while (this.peek().type === 'PLUS' || this.peek().type === 'MINUS') {
      const op = this.peek().type
      this.pos++
      const right = this.term()
      if (op === 'PLUS') left += right
      else left -= right
    }
    return left
  }

  private term(): number {
    let left = this.unary()
    while (this.peek().type === 'STAR' || this.peek().type === 'SLASH' || this.peek().type === 'PERCENT') {
      const op = this.peek().type
      this.pos++
      const right = this.unary()
      if (op === 'STAR') left *= right
      else if (op === 'SLASH') {
        if (right === 0) throw new Error('division by zero')
        left /= right
      } else {
        left %= right
      }
    }
    return left
  }

  private unary(): number {
    if (this.peek().type === 'MINUS') {
      this.pos++
      return -this.unary()
    }
    if (this.peek().type === 'PLUS') {
      this.pos++
      return this.unary()
    }
    return this.power()
  }

  private power(): number {
    const left = this.primary()
    if (this.peek().type === 'POW') {
      this.pos++
      const right = this.power()
      return Math.pow(left, right)
    }
    return left
  }

  private primary(): number {
    const token = this.peek()

    if (token.type === 'NUMBER') {
      this.pos++
      return Number(token.value)
    }

    if (token.type === 'LPAREN') {
      this.pos++
      const result = this.expression()
      this.consume('RPAREN')
      return result
    }

    if (token.type === 'IDENTIFIER') {
      this.pos++
      const name = token.value

      if (this.peek().type === 'LPAREN') {
        this.pos++
        const args: number[] = []
        if (this.peek().type !== 'RPAREN') {
          args.push(this.expression())
          while (this.peek().type === 'COMMA') {
            this.pos++
            args.push(this.expression())
          }
        }
        this.consume('RPAREN')

        const fn = MATH_FUNCTIONS[name]
        if (!fn) throw new Error(`unknown function: ${name}`)
        return fn(...args)
      }

      const constant = MATH_CONSTANTS[name]
      if (constant === undefined) throw new Error(`unknown identifier: ${name}`)
      return constant
    }

    throw new Error(`unexpected ${token.type}`)
  }
}

function safeEval(expression: string, precision: number): number {
  const tokens = tokenize(expression.trim())
  if (tokens.length === 0 || (tokens.length === 1 && tokens[0].type === 'EOF')) {
    exitWithError('invalid expression — only numbers, operators, and math functions allowed')
  }

  try {
    const parser = new Parser(tokens)
    const result = parser.parse()
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
