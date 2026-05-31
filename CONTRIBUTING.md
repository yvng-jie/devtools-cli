# Contributing

Thanks for considering contributing to `devtools-cli`! 🎉

## Getting Started

```bash
git clone https://github.com/yvng-jie/devtools-cli.git
cd devtools-cli
pnpm install
pnpm build            # Build dist/ (required before running dt)
npm link              # Make dt available globally (optional, for demo)
```

## Development

```bash
pnpm dev <command>     # Run in dev mode (e.g. pnpm dev uuid)
pnpm build             # Build for production → dist/
pnpm test              # Run tests (vitest)
pnpm lint              # Check code style (ESLint)
pnpm typecheck         # TypeScript type check
```

## Project Structure

```
src/
  index.ts               — CLI entry point (router)
  interactive.ts         — Interactive mode
  help.ts                — Help & version output
  utils.ts               — Shared utilities (readStdinSync, copyToClipboard)
  errors.ts              — ExitError class & exit helpers
  data/                  — Static data files
    named-colors.ts      — 148 CSS named colors
  commands/
    types.ts             — Command interface
    index.ts             — Command registry (aggregates all commands)
    uuid.ts              — UUID generation
    base64.ts            — Base64 encode/decode
    color.ts             — Color conversion
    jwt.ts               — JWT decode
    hash.ts              — SHA hashing
    timestamp.ts         — Unix timestamp conversion
    __tests__/           — Unit tests
```

## Architecture — Command Registry Pattern

Every command is defined by a `Command` object:

```typescript
// src/commands/types.ts
export interface Command {
  name: string
  aliases: string[] // e.g. ['ts'] for timestamp
  description: string // Shown in `dt help`
  run: (args: string[]) => void
  help: () => void
}
```

Commands are registered in `src/commands/index.ts` — when you add a new command file, import it there:

```typescript
// src/commands/index.ts
import { yourCommand } from './your-command.js'

export const commands: Command[] = [
  // ... existing commands,
  yourCommand,
]
```

The router (`src/index.ts`) and interactive mode (`src/interactive.ts`) automatically pick up new commands from the registry — **no manual switch-case or menu edits needed**.

## How to Add a New Command

This step-by-step guide walks you through adding a hypothetical `echo` command.

### Step 1 — Create the command file

Create `src/commands/echo.ts`:

```typescript
import chalk from 'chalk'
import { exitWithError } from '../errors.js'
import { readStdinSync } from '../utils.js'
import type { Command } from './types.js'

export function echo(args: string[]) {
  const jsonMode = args.includes('--json')
  const filteredArgs = args.filter((a) => a !== '--json')

  const input = filteredArgs.join(' ') || readStdinSync()
  if (!input) {
    exitWithError('no input provided')
  }

  if (jsonMode) {
    console.log(JSON.stringify({ input }))
    return
  }

  console.log(input)
}

function echoHelp() {
  console.log(chalk.bold('\n  echo — Echo back the input'))
  console.log(`  ${chalk.dim('────')}`)
  console.log('')
  console.log(`  ${chalk.yellow('Usage:')}`)
  console.log('    dt echo <text>')
  console.log('    echo <text> | dt echo')
  console.log('')
  console.log(`  ${chalk.yellow('Examples:')}`)
  console.log('    dt echo "hello world"')
  console.log('    echo "hello" | dt echo')
  console.log('')
}

export const echoCommand: Command = {
  name: 'echo',
  aliases: [],
  description: 'Echo back the input text',
  run: echo,
  help: echoHelp,
}
```

**Key rules:**

- Export both the run function (`echo`) and the command object (`echoCommand`)
- The run function is exported separately so tests can call it directly
- Use `exitWithError()` for errors, never `process.exit()`
- Always use `.js` extension for imports (ESM)
- Use `chalk` for colored output, never raw ANSI codes

### Step 2 — Register in the registry

Open `src/commands/index.ts` and add your command:

```typescript
import { echoCommand } from './echo.js'

export const commands: Command[] = [
  uuidCommand,
  base64Command,
  colorCommand,
  jwtCommand,
  hashCommand,
  timestampCommand,
  echoCommand, // <-- add here
]
```

That's it! The command will now appear in:

- `dt help` — listed automatically
- `dt echo` — runs the command
- `dt echo --help` — shows help
- Interactive mode — appears in the menu
- `dt help echo` — shows help

### Step 3 — Add tests

Create `src/commands/__tests__/echo.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { echo } from '../echo.js'
import { ExitError } from '../../errors.js'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('echo', () => {
  it('should echo input', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    echo(['hello world'])
    expect(spy).toHaveBeenCalledWith('hello world')
  })

  it('should support --json output', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    echo(['hello', '--json'])
    expect(spy).toHaveBeenCalledWith(JSON.stringify({ input: 'hello' }))
  })
})
```

### Step 4 — Test and submit

```bash
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

Submit a PR! 🎉

## Pull Request Checklist

- [ ] Code compiles (`pnpm build`)
- [ ] Tests pass (`pnpm test`)
- [ ] Lint passes (`pnpm lint`)
- [ ] TypeScript checks pass (`pnpm typecheck`)
- [ ] New functionality includes tests
- [ ] Command is registered in `src/commands/index.ts`

## Code Style Notes

- **No external runtime dependencies** — only `chalk` is allowed. Everything else uses Node.js built-in APIs
- **ESM only** — all imports must use the `.js` extension (e.g. `import { foo } from './bar.js'`)
- **Error handling** — throw `ExitError` or use `exitWithError()`, never call `process.exit()`
- **`--json` support** — all commands should support `--json` for machine-readable output
- **Pipe support** — accept input from `stdin` via `readStdinSync()` when no argument is provided
- **Interactive mode** — if your command has custom prompts, add a handler in `src/interactive.ts`

## Reporting Issues

Open an issue at https://github.com/yvng-jie/devtools-cli/issues
