import chalk from 'chalk'
import { exitWithError } from '../errors.js'

// ── helpers ─────────────────────────────────────────────────────────────────

const NAMED_COLORS: Record<string, string> = {
  aliceblue: '#f0f8ff',
  antiquewhite: '#faebd7',
  aqua: '#00ffff',
  aquamarine: '#7fffd4',
  azure: '#f0ffff',
  beige: '#f5f5dc',
  bisque: '#ffe4c4',
  black: '#000000',
  blanchedalmond: '#ffebcd',
  blue: '#0000ff',
  blueviolet: '#8a2be2',
  brown: '#a52a2a',
  burlywood: '#deb887',
  cadetblue: '#5f9ea0',
  chartreuse: '#7fff00',
  chocolate: '#d2691e',
  coral: '#ff7f50',
  cornflowerblue: '#6495ed',
  cornsilk: '#fff8dc',
  crimson: '#dc143c',
  cyan: '#00ffff',
  darkblue: '#00008b',
  darkcyan: '#008b8b',
  darkgoldenrod: '#b8860b',
  darkgray: '#a9a9a9',
  darkgreen: '#006400',
  darkgrey: '#a9a9a9',
  darkkhaki: '#bdb76b',
  darkmagenta: '#8b008b',
  darkolivegreen: '#556b2f',
  darkorange: '#ff8c00',
  darkorchid: '#9932cc',
  darkred: '#8b0000',
  darksalmon: '#e9967a',
  darkseagreen: '#8fbc8f',
  darkslateblue: '#483d8b',
  darkslategray: '#2f4f4f',
  darkslategrey: '#2f4f4f',
  darkturquoise: '#00ced1',
  darkviolet: '#9400d3',
  deeppink: '#ff1493',
  deepskyblue: '#00bfff',
  dimgray: '#696969',
  dimgrey: '#696969',
  dodgerblue: '#1e90ff',
  firebrick: '#b22222',
  floralwhite: '#fffaf0',
  forestgreen: '#228b22',
  fuchsia: '#ff00ff',
  gainsboro: '#dcdcdc',
  ghostwhite: '#f8f8ff',
  gold: '#ffd700',
  goldenrod: '#daa520',
  gray: '#808080',
  green: '#008000',
  greenyellow: '#adff2f',
  grey: '#808080',
  honeydew: '#f0fff0',
  hotpink: '#ff69b4',
  indianred: '#cd5c5c',
  indigo: '#4b0082',
  ivory: '#fffff0',
  khaki: '#f0e68c',
  lavender: '#e6e6fa',
  lavenderblush: '#fff0f5',
  lawngreen: '#7cfc00',
  lemonchiffon: '#fffacd',
  lightblue: '#add8e6',
  lightcoral: '#f08080',
  lightcyan: '#e0ffff',
  lightgoldenrodyellow: '#fafad2',
  lightgray: '#d3d3d3',
  lightgreen: '#90ee90',
  lightgrey: '#d3d3d3',
  lightpink: '#ffb6c1',
  lightsalmon: '#ffa07a',
  lightseagreen: '#20b2aa',
  lightskyblue: '#87cefa',
  lightslategray: '#778899',
  lightslategrey: '#778899',
  lightsteelblue: '#b0c4de',
  lightyellow: '#ffffe0',
  lime: '#00ff00',
  limegreen: '#32cd32',
  linen: '#faf0e6',
  magenta: '#ff00ff',
  maroon: '#800000',
  mediumaquamarine: '#66cdaa',
  mediumblue: '#0000cd',
  mediumorchid: '#ba55d3',
  mediumpurple: '#9370db',
  mediumseagreen: '#3cb371',
  mediumslateblue: '#7b68ee',
  mediumspringgreen: '#00fa9a',
  mediumturquoise: '#48d1cc',
  mediumvioletred: '#c71585',
  midnightblue: '#191970',
  mintcream: '#f5fffa',
  mistyrose: '#ffe4e1',
  moccasin: '#ffe4b5',
  navajowhite: '#ffdead',
  navy: '#000080',
  oldlace: '#fdf5e6',
  olive: '#808000',
  olivedrab: '#6b8e23',
  orange: '#ffa500',
  orangered: '#ff4500',
  orchid: '#da70d6',
  palegoldenrod: '#eee8aa',
  palegreen: '#98fb98',
  paleturquoise: '#afeeee',
  palevioletred: '#db7093',
  papayawhip: '#ffefd5',
  peachpuff: '#ffdab9',
  peru: '#cd853f',
  pink: '#ffc0cb',
  plum: '#dda0dd',
  powderblue: '#b0e0e6',
  purple: '#800080',
  rebeccapurple: '#663399',
  red: '#ff0000',
  rosybrown: '#bc8f8f',
  royalblue: '#4169e1',
  saddlebrown: '#8b4513',
  salmon: '#fa8072',
  sandybrown: '#f4a460',
  seagreen: '#2e8b57',
  seashell: '#fff5ee',
  sienna: '#a0522d',
  silver: '#c0c0c0',
  skyblue: '#87ceeb',
  slateblue: '#6a5acd',
  slategray: '#708090',
  slategrey: '#708090',
  snow: '#fffafa',
  springgreen: '#00ff7f',
  steelblue: '#4682b4',
  tan: '#d2b48c',
  teal: '#008080',
  thistle: '#d8bfd8',
  tomato: '#ff6347',
  turquoise: '#40e0d0',
  violet: '#ee82ee',
  wheat: '#f5deb3',
  white: '#ffffff',
  whitesmoke: '#f5f5f5',
  yellow: '#ffff00',
  yellowgreen: '#9acd32',
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

  const jsonMode = args.includes('--json')
  const filteredArgs = args.filter((a) => a !== '--json')

  const raw = filteredArgs.join(' ').trim()
  if (!raw) {
    exitWithError('provide a color value')
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
    exitWithError(
      `could not parse "${raw}" — supported: HEX (#ff7f50), RGB (rgb(255,127,80)), HSL (hsl(16,100%,66%)), named (coral)`,
    )
  }

  hsl ??= rgbToHsl(rgb.r, rgb.g, rgb.b)

  if (jsonMode) {
    console.log(
      JSON.stringify({ hex, rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` }),
    )
    return
  }

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
