import { uuidCommand } from './uuid.js'
import { base64Command } from './base64.js'
import { colorCommand } from './color.js'
import { jwtCommand } from './jwt.js'
import { hashCommand } from './hash.js'
import { timestampCommand } from './timestamp.js'
import type { Command } from './types.js'

export const commands: Command[] = [uuidCommand, base64Command, colorCommand, jwtCommand, hashCommand, timestampCommand]

export function findCommand(name: string): Command | undefined {
  return commands.find((cmd) => cmd.name === name || cmd.aliases.includes(name))
}
