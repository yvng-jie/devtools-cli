---
name: '[Feature] Add `json` command'
about: Format, validate, and minify JSON in your terminal
title: '[Feature] `json` command — format, validate, and minify JSON'
labels: ['enhancement', 'good first issue']
assignees: ''
---

## Description

Add a `dt json` command that lets developers **format**, **validate**, and **minify** JSON directly in the terminal — no more switching to browser-based tools.

This is a **Good First Issue** — the implementation is self-contained, uses only Node.js built-in APIs, and follows the same pattern as existing commands (e.g. `src/commands/base64.ts`).

## Usage

```bash
# Format JSON (pretty-print)
dt json '{"name":"test","version":1}'

# Validate only
dt json --validate '{"broken": true'

# Minify / compact
dt json --minify '{"name": "test",   "version":   1}'

# Pipe support
echo '{"a":1}' | dt json

# Pipe + flag
cat data.json | dt json --minify
```

## Expected Output

### Format (default)

```
$ dt json '{"name":"test","version":1}'

{
  "name": "test",
  "version": 1
}
```

### Validate

```
$ dt json --validate '{"broken": true'

Error: invalid JSON — Unexpected token at position 16
```

### Minify

```
$ dt json --minify '{"name": "test",   "version":   1}'
{"name":"test","version":1}
```

## Acceptance Criteria

- [ ] `dt json <string>` outputs formatted (pretty-printed) JSON
- [ ] `dt json --validate <string>` exits with error message if JSON is invalid
- [ ] `dt json --minify <string>` outputs compact JSON
- [ ] `echo <json> | dt json` works via stdin pipe
- [ ] Pipe + flag combination works: `cat data.json | dt json --minify`
- [ ] Help text: `dt json --help`
- [ ] Interactive mode support (option in `src/interactive.ts`)
- [ ] Registered in `src/index.ts` (command `json`, alias `j`)
- [ ] Listed in `src/help.ts`
- [ ] Tests in `src/commands/__tests__/json.test.ts` covering:
  - Format valid JSON
  - Validate invalid JSON → throws ExitError
  - Minify output
  - Pipe input
  - Empty input → throws ExitError
  - `--help` / `-h` flags
- [ ] All existing tests still pass (`pnpm test run`)
- [ ] No lint errors (`pnpm lint`)

## Implementation Notes

- **Dependencies**: zero — use `JSON.parse()` and `JSON.stringify()` (Node.js built-in)
- **Pattern**: follow `src/commands/base64.ts` structure:
  - Import `exitWithError` / `exitWithUsage` from `../errors.js`
  - Import `readStdinSync` from `../utils.js`
- **Files to modify**:
  - `src/commands/json.ts` — **create** (main command + help function)
  - `src/commands/__tests__/json.test.ts` — **create**
  - `src/index.ts` — add import and route cases (`json` + alias `j`)
  - `src/help.ts` — add to command list + example
  - `src/interactive.ts` — add interactive menu option
  - `README.md` — add command table entry + examples section

## Tips for Contributors

- Run `pnpm dev json '{"test": 1}'` to test during development
- Run `pnpm test` to verify all tests
- Run `pnpm lint` to check code style
- Check existing commands (especially `base64.ts` and `timestamp.ts`) for reference patterns

## Related

- Similar pattern: `#timestamp-command` (previous feature)
