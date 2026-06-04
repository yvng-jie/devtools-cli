import type { Interface } from 'node:readline'

export type CommandCategory =
  | 'crypto'
  | 'encoding'
  | 'network'
  | 'data'
  | 'utility'
  | 'math'
  | 'media'

export interface Command {
  name: string
  aliases: string[]
  category: CommandCategory
  description: string
  run: (args: string[]) => void
  help: () => void
  /** Interactive mode handler (optional). Receives a readline interface for prompts. */
  interactive?: (rl: Interface) => Promise<void>
}
