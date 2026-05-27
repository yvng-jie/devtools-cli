import chalk from 'chalk'

// ── helpers ─────────────────────────────────────────────────────────────────

const NAMED_COLORS: Record<string, string> = {
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  white: '#ffffff',
  black: '#000000',
  gray: '#808080',
  silver: '#c0c0c0',
  maroon: '#800000',
  purple: '#800080',
  fuchsia: '#ff00ff',
  lime: '#00ff00',
  olive: '#808000',
  yellow: '#ffff00',
  navy: '#000080',
  teal: '#008080',
  aqua: '#00ffff',
  orange: '#ffa500',
  coral: '#ff7f50',
  tomato: '#ff6347',
  gold: '#ffd700',
  pink: '#ffc0cb',
  violet: '#ee82ee',
  cyan: '#00ffff',
  magenta: '#ff00ff',
  indigo: '#4b0082',
  crimson: '#dc143c',
  salmon: '#fa8072',
  turquoise: '#40e0d0',
  plum: '#dda0dd',
  orchid: '#da70d6',
  rebeccapurple: '#663399',
  chocolate: '#d2691e',
  steelblue: '#4682b4',
  dodgerblue: '#1e90ff',
  skyblue: '#87ceeb',
  deepskyblue: '#00bfff',
  lightblue: '#add8e6',
  royalblue: '#4169e1',
  forestgreen: '#228b22',
  darkgreen: '#006400',
  seagreen: '#2e8b57',
  limegreen: '#32cd32',
  darkred: '#8b0000',
  firebrick: '#b22222',
}

interface Rgb {
  r: number
  g: number
  b: number
}
interface Hsl {
  h: number
  s: number
  l: number
}

function hexToRgb(hex: string): Rgb | null {
  const h = hex.replace(/^#/, '')
  if (h.length === 3) {
    return { r: parseInt(h[0] + h[0], 16), g: parseInt(h[1] + h[1], 16), b: parseInt(h[2] + h[2], 16) }
  }
  if (h.length === 6) {
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }
  }
  return null
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  )
}

function rgbToHsl(r: number, g: number, b: number): Hsl {
  const rr = r / 255,
    gg = g / 255,
    bb = b / 255
  const max = Math.max(rr, gg, bb),
    min = Math.min(rr, gg, bb)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) * 60
  else if (max === gg) h = ((bb - rr) / d + 2) * 60
  else h = ((rr - gg) / d + 4) * 60
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const ss = s / 100,
    ll = l / 100
  const c = (1 - Math.abs(2 * ll - 1)) * ss
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = ll - c / 2
  let r = 0,
    g = 0,
    b = 0
  if (h < 60) {
    r = c
    g = x
  } else if (h < 120) {
    r = x
    g = c
  } else if (h < 180) {
    g = c
    b = x
  } else if (h < 240) {
    g = x
    b = c
  } else if (h < 300) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) }
}

function parseRgb(str: string): Rgb | null {
  const m = str.match(/rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/)
  if (!m) return null
  const r = Number(m[1]),
    g = Number(m[2]),
    b = Number(m[3])
  if (r > 255 || g > 255 || b > 255) return null
  return { r, g, b }
}

function parseHsl(str: string): Hsl | null {
  const m = str.match(/hsla?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%/)
  if (!m) return null
  const h = Number(m[1]),
    s = Number(m[2]),
    l = Number(m[3])
  if (h > 360 || s > 100 || l > 100) return null
  return { h, s, l }
}

// ── main ────────────────────────────────────────────────────────────────────

export function color(args: string[]) {
  if (args[0] === '--help' || args[0] === '-h') {
    colorHelp()
    return
  }

  const raw = args.join(' ').trim()
  if (!raw) {
    console.log(chalk.red('Error: provide a color value'))
    process.exit(1)
  }

  let hex = '',
    rgb: Rgb | null = null,
    hsl: Hsl | null = null

  // Try HEX
  if (/^#?[0-9a-fA-F]{3,6}$/.test(raw)) {
    const r = hexToRgb(raw.startsWith('#') ? raw : '#' + raw)
    if (r) {
      rgb = r
      hex = rgbToHex(r.r, r.g, r.b)
    }
  }
  // Try RGB
  if (!rgb) {
    rgb = parseRgb(raw)
    if (rgb) hex = rgbToHex(rgb.r, rgb.g, rgb.b)
  }
  // Try HSL
  if (!rgb) {
    hsl = parseHsl(raw)
    if (hsl) {
      rgb = hslToRgb(hsl.h, hsl.s, hsl.l)
      hex = rgbToHex(rgb.r, rgb.g, rgb.b)
    }
  }
  // Try named
  if (!rgb) {
    const h = NAMED_COLORS[raw.toLowerCase()]
    if (h) {
      const r = hexToRgb(h)
      if (r) {
        rgb = r
        hex = h.toUpperCase()
      }
    }
  }

  if (!rgb) {
    console.log(chalk.red(`Could not parse: ${raw}`))
    console.log(chalk.dim('  Supported: HEX (#ff7f50), RGB (rgb(255,127,80)), HSL (hsl(16,100%,66%)), named (coral)'))
    process.exit(1)
    return
  }

  hsl ??= rgbToHsl(rgb.r, rgb.g, rgb.b)

  const colorHex = chalk.hex(hex)

  console.log('')
  console.log(`  ${colorHex('████████████')}  ${colorHex('████████')}`)
  console.log(`  ${colorHex('████████████')}  ${colorHex.bold('  PREVIEW')}`)
  console.log(`  ${colorHex('████████████')}  ${chalk.dim('  ───────')}`)
  console.log(`  ${colorHex('████████████')}`)
  console.log('')
  console.log(`  ${chalk.bold('HEX')}  ${chalk.green(hex)}`)
  console.log(`  ${chalk.bold('RGB')}  ${chalk.green(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)}`)
  console.log(`  ${chalk.bold('HSL')}  ${chalk.green(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}`)
  console.log('')
}

function colorHelp() {
  console.log(chalk.bold('\n  color — Convert colors between formats'))
  console.log(`  ${chalk.dim('─────')}`)
  console.log('')
  console.log(`  ${chalk.yellow('Usage:')}`)
  console.log('    dt color <value>')
  console.log('')
  console.log(`  ${chalk.yellow('Supported formats:')}`)
  console.log('    HEX:  #FF7F50, ff7f50')
  console.log('    RGB:  rgb(255, 127, 80)')
  console.log('    HSL:  hsl(16, 100%, 66%)')
  console.log('    Name: coral, steelblue, rebeccapurple')
  console.log('')
  console.log(`  ${chalk.yellow('Examples:')}`)
  console.log('    dt color #ff7f50')
  console.log('    dt color "rgb(255, 127, 80)"')
  console.log('    dt color coral')
  console.log('')
}
