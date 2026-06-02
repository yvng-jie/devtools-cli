import chalk from 'chalk'
import { exitWithError } from '../errors.js'
import type { Command } from './types.js'
import { NAMED_COLORS } from '../data/named-colors.js'

interface Rgb {
  r: number
  g: number
  b: number
  a?: number
}
interface Hsl {
  h: number
  s: number
  l: number
  a?: number
}

function hexToRgb(hex: string): Rgb | null {
  const h = hex.replace(/^#/, '')
  if (h.length === 3) {
    return { r: parseInt(h[0] + h[0], 16), g: parseInt(h[1] + h[1], 16), b: parseInt(h[2] + h[2], 16) }
  }
  if (h.length === 4) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
      a: Math.round((parseInt(h[3] + h[3], 16) / 255) * 100) / 100,
    }
  }
  if (h.length === 6) {
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }
  }
  if (h.length === 8) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: Math.round((parseInt(h.slice(6, 8), 16) / 255) * 100) / 100,
    }
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
  const m = str.match(/rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([\d.]+))?/)
  if (!m) return null
  const r = Number(m[1]),
    g = Number(m[2]),
    b = Number(m[3])
  if (r > 255 || g > 255 || b > 255) return null
  const a = m[4] !== undefined ? clampAlpha(Number(m[4])) : undefined
  return { r, g, b, a }
}

function parseHsl(str: string): Hsl | null {
  const m = str.match(/hsla?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%(?:\s*,\s*([\d.]+))?/)
  if (!m) return null
  const h = Number(m[1]),
    s = Number(m[2]),
    l = Number(m[3])
  if (h > 360 || s > 100 || l > 100) return null
  const a = m[4] !== undefined ? clampAlpha(Number(m[4])) : undefined
  return { h, s, l, a }
}

function clampAlpha(v: number): number {
  return Math.max(0, Math.min(1, Math.round(v * 100) / 100))
}

// ── main ────────────────────────────────────────────────────────────────────

export function color(args: string[]) {
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
  if (/^#?[0-9a-fA-F]{3,8}$/.test(raw)) {
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
      // Propagate alpha from hsl to rgb
      if (hsl.a !== undefined) rgb.a = hsl.a
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
  const _rgb = rgb!

  hsl ??= rgbToHsl(_rgb.r, _rgb.g, _rgb.b)
  // Propagate alpha from rgb to hsl
  if (_rgb.a !== undefined) hsl.a = _rgb.a

  const hasAlpha = _rgb.a !== undefined

  if (jsonMode) {
    const result: Record<string, string> = {
      hex,
      rgb: hasAlpha ? `rgba(${_rgb.r}, ${_rgb.g}, ${_rgb.b}, ${_rgb.a})` : `rgb(${_rgb.r}, ${_rgb.g}, ${_rgb.b})`,
      hsl: hasAlpha ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${hsl.a ?? 1})` : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    }
    console.log(JSON.stringify(result))
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
  if (hasAlpha) {
    console.log(`  ${chalk.bold('RGBA')} ${chalk.green(`rgba(${_rgb.r}, ${_rgb.g}, ${_rgb.b}, ${_rgb.a})`)}`)
    console.log(`  ${chalk.bold('HSLA')} ${chalk.green(`hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${hsl.a ?? 1})`)}`)
  } else {
    console.log(`  ${chalk.bold('RGB')}  ${chalk.green(`rgb(${_rgb.r}, ${_rgb.g}, ${_rgb.b})`)}`)
    console.log(`  ${chalk.bold('HSL')}  ${chalk.green(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}`)
  }
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
  console.log('    HEX:   #FF7F50, ff7f50')
  console.log('    HEXA:  #FF7F5080 (4 or 8 digits with alpha)')
  console.log('    RGB:   rgb(255, 127, 80)')
  console.log('    RGBA:  rgba(255, 127, 80, 0.5)')
  console.log('    HSL:   hsl(16, 100%, 66%)')
  console.log('    HSLA:  hsla(16, 100%, 66%, 0.5)')
  console.log('    Name:  coral, steelblue, rebeccapurple')
  console.log('')
  console.log(`  ${chalk.yellow('Examples:')}`)
  console.log('    dt color #ff7f50')
  console.log('    dt color "#ff7f5080"')
  console.log('    dt color "rgba(255, 127, 80, 0.5)"')
  console.log('    dt color coral')
  console.log('')
}

export const colorCommand: Command = {
  name: 'color',
  aliases: [],
  description: 'Convert colors (HEX / RGB / HSL / named)',
  run: color,
  help: colorHelp,
}
