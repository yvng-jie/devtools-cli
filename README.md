  devkits  ::  Terminal Swiss Army Knife
  dt -- uuid, base64, jwt, hash, color, qrcode & more

  npm install -g devkits
  dt <command> [options]

────────────────────────────────────────


Features

  Zero setup         Install once, use anywhere with the dt command
  Interactive mode   Run dt with no args for a categorized menu
  Search mode        Press s or / in interactive mode to search commands
  Number shortcuts   Select commands by number or alias in interactive mode
  Pipe friendly      echo "hello" | dt base64 encode
  JSON output        Add --json for machine-readable output, pipeable to jq
  Clipboard copy     Press C in interactive mode to copy results
  Minimal deps       Only depends on chalk and qrcode


Demo

  dt                      Interactive categorized menu
  dt help                 Show help grouped by category
  dt help <command>       Show help for a specific command
  dt <command> --help     Same as above
  dt <command> --json     Structured JSON output


Commands

  Security & Crypto

    jwt                  Decode JWT with expiry detection & HMAC verification
    hash                 Generate SHA hashes (sha1/256/384/512) & HMAC

  Encoding

    base64               Encode or decode Base64 (standard & URL-safe)
    url                  Encode, decode, or parse URLs & query strings

  Network

    cidr                 CIDR/IP calculator (network, broadcast, host range)
    mac                  Format and validate MAC addresses
    ip                   Look up IP address information & geolocation

  Data Processing

    json                 Format, validate, and highlight JSON
    diff                 Compare two strings or files
    csv                  Format and view CSV data
    ascii                ASCII / character lookup table
    case                 Convert strings between casing formats (camel, snake, kebab, ...)

  Utilities

    uuid                 Generate UUIDs (v1/v4/v7)
    color                Convert colors (HEX / RGB / HSL / named)
    timestamp (ts)       Convert between Unix timestamps and dates
    qrcode (qr)          Generate QR codes in the terminal
    random (rand)        Generate passwords & random numbers
    bytes                Convert byte sizes (B, KB, MB, GB, TB, PB)
    completion           Generate shell auto-completion scripts (bash/zsh/fish)
    cron                 Parse and describe cron expressions
    lorem                Generate Lorem ipsum placeholder text
    semver (sv)          Parse, validate, compare, and bump semantic versions

  Mathematics

    math                 Evaluate mathematical expressions
    number (num)         Convert numbers between decimal, hex, binary, octal

  Media

    image                Show image file metadata (PNG, JPEG, GIF, WebP)


Examples

  Base64

    dt base64 encode "hello world"
    dt base64 decode "aGVsbG8gd29ybGQ="
    echo "hello" | dt base64 encode
    dt base64 encode "hello" --json
    dt base64 encode "hello" --url

  Color

    dt color "#ff7f50"
    dt color "rgb(255, 127, 80)"
    dt color "hsl(16, 100%, 66%)"
    dt color coral
    dt color coral --json

  JWT

    dt jwt <token>
    dt jwt <token> --json
    dt jwt <token> --verify secret

  Hash

    dt hash "hello"
    dt hash "hello" --algo sha512
    echo "hello" | dt hash
    dt hash --file config.json
    dt hash "hello" --key secret

  Timestamp

    dt ts
    dt ts 1716806400
    dt ts "2026-05-28"
    dt ts 1716806400 --utc
    dt ts 1716806400 --iso
    dt ts now --json

  JSON

    dt json '{"a":1,"b":{"c":2}}'
    echo '{"a":1}' | dt json
    dt json '{"a":1}' --minify
    dt json "invalid" --validate

  QR Code

    dt qrcode "https://example.com"
    echo "hello" | dt qrcode

  Random

    dt random password
    dt random password -l 32 --no-symbols
    dt random number --min 1 --max 10

  URL

    dt url encode "hello world"
    dt url decode "hello%20world"
    dt url parse "?foo=1&bar=2"

  CIDR

    dt cidr 192.168.1.0/24
    dt cidr 10.0.0.0/8

  Math

    dt math "sqrt(16) * 3"
    dt math "2^10"
    dt math "100 / 3" --precision 4

  MAC

    dt mac aa:bb:cc:dd:ee:ff
    dt mac AA-BB-CC-DD-EE-FF
    dt mac aabb.ccdd.eeff

  Diff

    dt diff "abc" "abd"
    dt diff --file old.txt new.txt

  CSV

    echo "a,b,c\n1,2,3" | dt csv
    dt csv "name,age\nAlice,30"

  Image

    dt image screenshot.png
    dt image photo.jpg

  IP

    dt ip
    dt ip 8.8.8.8

  ASCII

    dt ascii
    dt ascii 65
    dt ascii A

  Bytes

    dt bytes 1024
    dt bytes "1 MB"
    dt bytes 1073741824 --json

  Case

    dt case "hello world" --to camel
    dt case "hello world" --to snake
    dt case "hello world" --to kebab

  Completion

    dt completion bash   > /etc/bash_completion.d/dt
    dt completion zsh    > /usr/local/share/zsh/site-functions/_dt
    dt completion fish   > ~/.config/fish/completions/dt.fish

  Cron

    dt cron "*/5 * * * *"
    dt cron "0 9 * * 1-5" --json

  Lorem

    dt lorem
    dt lorem --words 20
    dt lorem --paragraphs 3

  Semver

    dt semver 1.2.3
    dt semver 1.2.3 --bump patch
    dt semver "1.2.3" "2.0.0" --compare

  Number

    dt number 255
    dt number ff --from hex
    dt number 0b1010


Development

  git clone https://github.com/yvng-jie/devtools-cli.git
  cd devtools-cli
  pnpm install

  pnpm dev <command>     Run in dev mode (e.g. pnpm dev uuid)
  pnpm build             Production build -> dist/
  pnpm test              Run tests (vitest)
  pnpm lint              Check code style
  pnpm typecheck         TypeScript type check


License

  MIT  (c) yvng-jie
  https://github.com/yvng-jie/devtools-cli
