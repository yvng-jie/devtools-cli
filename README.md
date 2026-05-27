# devtools-cli

> Handy developer tools for your terminal — UUID, Base64, JWT, color converter, hash & more.

<p align="center">
  <img src="https://img.shields.io/npm/v/@yvng-jie/devtools-cli?color=blue&label=version" alt="npm version">
  <img src="https://img.shields.io/github/actions/workflow/status/yvng-jie/devtools-cli/ci.yml?branch=main" alt="CI">
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="Node version">
  <img src="https://img.shields.io/npm/l/@yvng-jie/devtools-cli" alt="License">
</p>

## Install

```bash
npm install -g @yvng-jie/devtools-cli
# or with pnpm
pnpm add -g @yvng-jie/devtools-cli
```

Or use directly without installing:

```bash
npx @yvng-jie/devtools-cli
```

## Usage

```
dt <command> [options]
```

Or run interactively (no arguments):

```bash
dt
```

### Commands

| Command  | Description                      |
| -------- | -------------------------------- |
| `uuid`   | Generate random UUID v4          |
| `base64` | Encode or decode Base64          |
| `color`  | Convert colors (HEX / RGB / HSL) |
| `jwt`    | Decode a JWT token               |
| `hash`   | Generate SHA hashes              |
| `help`   | Show help message                |

### Examples

```bash
# Interactive mode
dt

# UUID
dt uuid
dt uuid --count 10

# Base64
dt base64 encode "hello world"
dt base64 decode "aGVsbG8gd29ybGQ="
echo "hello" | dt base64 encode

# Color conversion
dt color "#ff7f50"
dt color "rgb(255, 127, 80)"
dt color "hsl(16, 100%, 66%)"
dt color coral

# JWT decode
dt jwt "eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiSm9obiJ9.xxx"

# Hash
dt hash "hello"
dt hash "hello" --algo sha512
echo "hello" | dt hash
```

## Development

```bash
git clone https://github.com/yvng-jie/devtools-cli.git
cd devtools-cli
pnpm install
pnpm dev <command>   # dev mode
pnpm build           # production build
pnpm test            # run tests
pnpm lint            # check code style
pnpm typecheck       # TypeScript check
```

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT © [yvng-jie](https://github.com/yvng-jie)
