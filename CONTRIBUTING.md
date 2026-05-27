# Contributing

Thanks for considering contributing to `devtools-cli`! 🎉

## Getting Started

```bash
git clone https://github.com/yvng-jie/devtools-cli.git
cd devtools-cli
pnpm install
```

## Development

```bash
pnpm dev <command>     # Run in dev mode (e.g. pnpm dev uuid)
pnpm build             # Build for production
pnpm test              # Run tests
pnpm lint              # Check code style
pnpm typecheck         # TypeScript check
```

## Project Structure

```
src/
  index.ts          — CLI entry point
  interactive.ts    — Interactive mode
  help.ts           — Help & version output
  utils.ts          — Shared utilities
  commands/
    uuid.ts         — UUID generation
    base64.ts       — Base64 encode/decode
    color.ts        — Color conversion
    jwt.ts          — JWT decode
    hash.ts         — SHA hashing
    __tests__/      — Unit tests
```

## Pull Request Checklist

- [ ] Code compiles (`pnpm build`)
- [ ] Tests pass (`pnpm test`)
- [ ] Lint passes (`pnpm lint`)
- [ ] TypeScript checks pass (`pnpm typecheck`)
- [ ] New functionality includes tests

## Reporting Issues

Open an issue at https://github.com/yvng-jie/devtools-cli/issues
