<p align="center">
  <img src="https://img.shields.io/npm/v/@yangfree/devtools-cli?color=blue&label=version" alt="npm version">
  <img src="https://img.shields.io/github/actions/workflow/status/yvng-jie/devtools-cli/ci.yml?branch=main" alt="CI">
  <img src="https://img.shields.io/badge/node-%3E%3D22-brightgreen" alt="Node version">
  <img src="https://img.shields.io/npm/l/@yangfree/devtools-cli" alt="License">
  <img src="https://img.shields.io/github/stars/yvng-jie/devtools-cli?style=flat" alt="Stars">
</p>

<h1 align="center">🔧 dt — Developer Toolkit</h1>
<p align="center">
  <b>Terminal Swiss Army Knife</b><br>
  UUID · Base64 · Color Converter · JWT Decoder · SHA Hash — all in one command.
</p>

<p align="center">
  <i>No more leaving your terminal to copy-paste into online tools.</i>
</p>

---

## ✨ Features

<table>
<tr>
<td>⚡ <b>Zero setup</b></td>
<td>Install once, use anywhere with the <code>dt</code> command</td>
</tr>
<tr>
<td>🎮 <b>Interactive mode</b></td>
<td>Run <code>dt</code> with no args for a guided menu — great for beginners</td>
</tr>
<tr>
<td>⌨️ <b>Keyboard shortcuts</b></td>
<td>Interactive mode supports letter keys (<code>u</code>/<code>b</code>/<code>c</code>/<code>j</code>/<code>h</code>/<code>t</code>) and <code>b</code> to go back</td>
</tr>
<tr>
<td>🔗 <b>Pipe friendly</b></td>
<td><code>echo "hello" | dt base64 encode</code> — works with Unix pipelines</td>
</tr>
<tr>
<td>📋 <b>JSON output</b></td>
<td>Add <code>--json</code> for machine-readable output, pipeable to <code>jq</code></td>
</tr>
<tr>
<td>🎨 <b>Beautiful output</b></td>
<td>Colorful, well-formatted results with chalk</td>
</tr>
<tr>
<td>📦 <b>Zero runtime deps</b></td>
<td>Only depends on <code>chalk</code> — everything else uses Node.js built-in APIs</td>
</tr>
</table>

## 🚀 Install

```bash
# Install globally
npm install -g @yangfree/devtools-cli

# Or use directly without installing
npx @yangfree/devtools-cli
```

## 📖 Usage

```
dt <command> [options]
```

Run without arguments for interactive mode:

```bash
dt
```

Get help for any command:

```bash
dt help               # Show main help
dt help uuid          # Show help for a specific command
dt uuid --help        # Same as above
```

### Commands

| Command     | Description                               |
| ----------- | ----------------------------------------- |
| `uuid`      | Generate random UUID v4                   |
| `base64`    | Encode or decode Base64                   |
| `color`     | Convert colors (HEX / RGB / HSL / named)  |
| `jwt`       | Decode a JWT token with expiry detection  |
| `hash`      | Generate SHA hashes (sha1/256/384/512)    |
| `timestamp` | Convert between Unix timestamps and dates |
| `help`      | Show help message                         |

All commands support `--json` for structured JSON output.

### 📸 Examples

#### UUID

```bash
dt uuid
dt uuid --count 5
dt uuid --count 3 --json        # → {"uuids":["...","...","..."]}
```

#### Base64

```bash
dt base64 encode "hello world"
dt base64 decode "aGVsbG8gd29ybGQ="
echo "hello" | dt base64 encode
dt base64 encode "hello" --json # → {"action":"encode","input":"hello","output":"aGVsbG8="}
```

#### Color Converter

```bash
dt color "#ff7f50"
dt color "rgb(255, 127, 80)"
dt color "hsl(16, 100%, 66%)"
dt color coral
dt color coral --json           # → {"hex":"#FF7F50","rgb":"rgb(255,127,80)","hsl":"hsl(16,100%,66%)"}
```

#### JWT Decode

```bash
dt jwt "eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiSm9obiJ9.xxx"
dt jwt <token> --json           # → {"header":{...},"payload":{...},"expired":true/false}
```

#### Hash

```bash
dt hash "hello"
dt hash "hello" --algo sha512
echo "hello" | dt hash
dt hash "hello" --json          # → {"algorithm":"SHA256","input":"hello","hash":"2cf2..."}
```

#### Timestamp / ts

```bash
dt ts                         # Current timestamp
dt ts 1716806400              # Timestamp → readable date
dt ts "2026-05-28"            # Date → timestamp
dt ts 1716806400 --utc        # UTC time
dt ts 1716806400 --iso        # ISO 8601 format
dt ts now --json              # → {"unix":...,"iso":"...","local":"...","utc":"..."}
echo 1716806400 | dt ts       # Pipe input
```

## 🛠 Development

```bash
git clone https://github.com/yvng-jie/devtools-cli.git
cd devtools-cli
pnpm install

pnpm dev <command>   # Run in dev mode (e.g. pnpm dev uuid)
pnpm build           # Production build → dist/
pnpm test            # Run tests (vitest)
pnpm lint            # Check code style
pnpm typecheck       # TypeScript type check
```

## 🤝 Contributing

PRs and issues are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT © [yvng-jie](https://github.com/yvng-jie)
