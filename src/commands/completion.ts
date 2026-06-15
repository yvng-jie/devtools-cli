import { exitWithError } from '../errors.js'
import { createHelp } from '../help-builder.js'
import { commands } from './index.js'
import type { Command } from './types.js'

const SHELLS = ['bash', 'zsh', 'fish'] as const
type Shell = (typeof SHELLS)[number]

function generateBash(): string {
  const cmdNames = commands.map((c) => `"${c.name}"`).join(' ')
  const aliasNames = commands.filter((c) => c.aliases.length > 0).map((c) => `"${c.aliases[0]}"`).join(' ')

  return `# devkits (dt) bash completion
_dt_completions() {
  local cur=\${COMP_WORDS[COMP_CWORD]}
  local prev=\${COMP_WORDS[COMP_CWORD-1]}

  if [[ $COMP_CWORD -eq 1 ]]; then
    COMPREPLY=($(compgen -W "${cmdNames} ${aliasNames} help --help -h --version -v" -- "$cur"))
    return 0
  fi

  local cmd=\${COMP_WORDS[1]}
  case $cmd in
    help)
      COMPREPLY=($(compgen -W "${cmdNames} ${aliasNames}" -- "$cur"))
      ;;
    hash|h)
      case $prev in
        --algo|-a) COMPREPLY=($(compgen -W "sha1 sha256 sha384 sha512" -- "$cur")) ;;
        --file|-f) COMPREPLY=($(compgen -f -- "$cur")) ;;
        *) COMPREPLY=($(compgen -W "--algo -a --file -f --key -k --json --help -h" -- "$cur")) ;;
      esac
      ;;
    uuid)
      case $prev in
        --version|-v) COMPREPLY=($(compgen -W "1 4 7" -- "$cur")) ;;
        --count|-c) COMPREPLY=() ;;
        *) COMPREPLY=($(compgen -W "--count -c --version -v --json --help -h" -- "$cur")) ;;
      esac
      ;;
    random|rand)
      case $prev in
        --length|-l) COMPREPLY=() ;;
        --count|-c) COMPREPLY=() ;;
        --min|--max) COMPREPLY=() ;;
        *) COMPREPLY=($(compgen -W "password number --length -l --no-symbols --count -c --min --max --json --help -h" -- "$cur")) ;;
      esac
      ;;
    color)
      COMPREPLY=($(compgen -W "--json --lower --palette --count --help -h" -- "$cur"))
      ;;
    base64)
      COMPREPLY=($(compgen -W "encode decode --url --json --help -h" -- "$cur"))
      ;;
    json)
      COMPREPLY=($(compgen -W "query --minify -m --validate --json --help -h" -- "$cur"))
      ;;
    csv)
      COMPREPLY=($(compgen -W "select filter sort head stats --delimiter --json --help -h" -- "$cur"))
      ;;
    case)
      case $prev in
        --to) COMPREPLY=($(compgen -W "camel pascal snake kebab upper lower title" -- "$cur")) ;;
        *) COMPREPLY=($(compgen -W "--to --json --help -h" -- "$cur")) ;;
      esac
      ;;
    qrcode|qr)
      case $prev in
        --ecc) COMPREPLY=($(compgen -W "L M Q H" -- "$cur")) ;;
        --size) COMPREPLY=($(compgen -W "1 2 3 4" -- "$cur")) ;;
        *) COMPREPLY=($(compgen -W "--ecc --size --invert --json --help -h" -- "$cur")) ;;
      esac
      ;;
    number|num)
      case $prev in
        --to) COMPREPLY=($(compgen -W "decimal hex binary octal" -- "$cur")) ;;
        *) COMPREPLY=($(compgen -W "--to --json --help -h" -- "$cur")) ;;
      esac
      ;;
    bytes)
      case $prev in
        --to) COMPREPLY=($(compgen -W "B KB MB GB TB PB" -- "$cur")) ;;
        *) COMPREPLY=($(compgen -W "--to --si --json --help -h" -- "$cur")) ;;
      esac
      ;;
    cron)
      case $prev in
        --next) COMPREPLY=() ;;
        *) COMPREPLY=($(compgen -W "--next --validate --json --help -h" -- "$cur")) ;;
      esac
      ;;
    lorem)
      COMPREPLY=($(compgen -W "--paragraphs -p --sentences -s --words -w --start --json --help -h" -- "$cur"))
      ;;
    ascii)
      COMPREPLY=($(compgen -W "--range --extended --json --help -h" -- "$cur"))
      ;;
    completion)
      COMPREPLY=($(compgen -W "bash zsh fish --help -h" -- "$cur"))
      ;;
    *)
      COMPREPLY=($(compgen -W "--json --help -h" -- "$cur"))
      ;;
  esac
}

complete -F _dt_completions dt
`
}

function generateZsh(): string {
  return `#compdef dt
# devkits (dt) zsh completion

_dt_commands() {
  local -a commands
  commands=(
    ${commands.map((c) => `'${c.name}:${c.description}'`).join('\n    ')}
  )
  _describe 'command' commands
}

_dt() {
  local context state state_descr line
  typeset -A opt_args

  _arguments -C \\
    '--json[Output as JSON]' \\
    '--help[Show help]' \\
    '-h[Show help]' \\
    '--version[Show version]' \\
    '-v[Show version]' \\
    '1: :->command' \\
    '*: :->args'

  case $state in
    command)
      _dt_commands
      ;;
    args)
      case $words[1] in
        help) _dt_commands ;;
        hash)
          _arguments '--algo[Algorithm]:algorithm:(sha1 sha256 sha384 sha512)' \\
            '-a[Algorithm]:algorithm:(sha1 sha256 sha384 sha512)' \\
            '--file[File path]:file:_files' \\
            '-f[File path]:file:_files' \\
            '--key[HMAC key]' \\
            '-k[HMAC key]'
          ;;
        uuid)
          _arguments '--version[UUID version]:version:(1 4 7)' \\
            '-v[UUID version]:version:(1 4 7)' \\
            '--count[Number of UUIDs]' \\
            '-c[Number of UUIDs]'
          ;;
        random|rand)
          _arguments '--length[Length]:length:' \\
            '-l[Length]:length:' \\
            '--no-symbols[Exclude symbols]' \\
            '--count[Count]:count:' \\
            '-c[Count]:count:' \\
            '--min[Min value]:min:' \\
            '--max[Max value]:max:'
          ;;
        qrcode|qr)
          _arguments '--ecc[ECC level]:(L M Q H)' \\
            '--size[Module size]:(1 2 3 4)' \\
            '--invert[Invert colors]'
          ;;
        color)
          _arguments '--lower[Lowercase hex]' \\
            '--palette[Palette type]:(complementary analogous triadic tetradic monochromatic)' \\
            '--count[Count]'
          ;;
        json)
          _arguments '--minify[Minify]' \\
            '-m[Minify]' \\
            '--validate[Validate]'
          ;;
        csv)
          _arguments '--delimiter[Delimiter]:delimiter:' \\
            'select[Select columns]' \\
            'filter[Filter rows]' \\
            'sort[Sort by column]' \\
            'head[First N rows]' \\
            'stats[Show statistics]'
          ;;
        number|num)
          _arguments '--to[Output format]:(decimal hex binary octal)'
          ;;
        bytes)
          _arguments '--to[Output unit]:(B KB MB GB TB PB)' \\
            '--si[SI units]'
          ;;
        cron)
          _arguments '--next[Next N executions]' \\
            '--validate[Validate only]'
          ;;
        lorem)
          _arguments '--paragraphs[Paragraphs]:paragraphs:' \\
            '-p[Paragraphs]:paragraphs:' \\
            '--sentences[Sentences]:sentences:' \\
            '-s[Sentences]:sentences:' \\
            '--words[Words]:words:' \\
            '-w[Words]:words:' \\
            '--start[Custom start]:start:'
          ;;
        ascii)
          _arguments '--range[Range]:range:' \\
            '--extended[Extended ASCII]'
          ;;
        completion)
          _arguments '1:shell:(bash zsh fish)'
          ;;
        case)
          _arguments '--to[Format]:(camel pascal snake kebab upper lower title)'
          ;;
      esac
      ;;
  esac
}

_dt "$@"
`
}

function generateFish(): string {
  const cmdList = commands.map((c) => {
    const aliases = c.aliases.length > 0 ? ` -a '${c.aliases.join(' ')}'` : ''
    return `complete -c dt -f -n '__fish_dt_no_subcommand' -a '${c.name}'${aliases} -d '${c.description.replace(/'/g, "\\'")}'`
  }).join('\n')

  return `# devkits (dt) fish completion
function __fish_dt_no_subcommand
  set -l cmd (commandline -opc)
  if [ (count $cmd) -eq 1 ]
    return 0
  end
  return 1
end

function __fish_dt_using_subcommand
  set -l cmd (commandline -opc)
  if [ (count $cmd) -gt 1 ]
    set -l sub (string trim -- $cmd[2])
    if [ "$sub" = "$argv[1]" ]
      return 0
    end
  end
  return 1
end

${cmdList}

# Global flags
complete -c dt -n '__fish_dt_no_subcommand' -l json -d 'Output as JSON'
complete -c dt -n '__fish_dt_no_subcommand' -l help -s h -d 'Show help'
complete -c dt -n '__fish_dt_no_subcommand' -l version -s v -d 'Show version'

# Command-specific completions
complete -c dt -n '__fish_dt_using_subcommand hash' -l algo -s a -xa 'sha1 sha256 sha384 sha512' -d 'Hash algorithm'
complete -c dt -n '__fish_dt_using_subcommand hash' -l file -s f -r -d 'File to hash'
complete -c dt -n '__fish_dt_using_subcommand hash' -l key -s k -r -d 'HMAC key'

complete -c dt -n '__fish_dt_using_subcommand uuid' -l version -s v -xa '1 4 7' -d 'UUID version'
complete -c dt -n '__fish_dt_using_subcommand uuid' -l count -s c -r -d 'Number of UUIDs'

complete -c dt -n '__fish_dt_using_subcommand color' -l lower -d 'Lowercase hex'
complete -c dt -n '__fish_dt_using_subcommand color' -l palette -xa 'complementary analogous triadic tetradic monochromatic' -d 'Palette type'
complete -c dt -n '__fish_dt_using_subcommand color' -l count -r -d 'Palette count'

complete -c dt -n '__fish_dt_using_subcommand qrcode' -l ecc -xa 'L M Q H' -d 'ECC level'
complete -c dt -n '__fish_dt_using_subcommand qrcode' -l size -xa '1 2 3 4' -d 'Module size'
complete -c dt -n '__fish_dt_using_subcommand qrcode' -l invert -d 'Invert colors'

complete -c dt -n '__fish_dt_using_subcommand json' -l minify -s m -d 'Minify'
complete -c dt -n '__fish_dt_using_subcommand json' -l validate -d 'Validate'

complete -c dt -n '__fish_dt_using_subcommand csv' -l delimiter -r -d 'Field delimiter'
complete -c dt -n '__fish_dt_using_subcommand csv' -a 'select filter sort head stats' -d 'CSV operations'

complete -c dt -n '__fish_dt_using_subcommand number' -l to -xa 'decimal hex binary octal' -d 'Output format'
complete -c dt -n '__fish_dt_using_subcommand bytes' -l to -xa 'B KB MB GB TB PB' -d 'Output unit'
complete -c dt -n '__fish_dt_using_subcommand bytes' -l si -d 'SI units'

complete -c dt -n '__fish_dt_using_subcommand cron' -l next -r -d 'Next N executions'
complete -c dt -n '__fish_dt_using_subcommand cron' -l validate -d 'Validate only'

complete -c dt -n '__fish_dt_using_subcommand lorem' -l paragraphs -s p -r -d 'Paragraphs'
complete -c dt -n '__fish_dt_using_subcommand lorem' -l sentences -s s -r -d 'Sentences'
complete -c dt -n '__fish_dt_using_subcommand lorem' -l words -s w -r -d 'Words'
complete -c dt -n '__fish_dt_using_subcommand lorem' -l start -r -d 'Custom start text'

complete -c dt -n '__fish_dt_using_subcommand ascii' -l range -r -d 'Range'
complete -c dt -n '__fish_dt_using_subcommand ascii' -l extended -d 'Extended ASCII'

complete -c dt -n '__fish_dt_using_subcommand case' -l to -xa 'camel pascal snake kebab upper lower title' -d 'Case format'

complete -c dt -n '__fish_dt_using_subcommand completion' -a 'bash zsh fish'
`
}

export function completion(args: string[]) {
  const shell = args[0]?.toLowerCase()

  if (!shell || !SHELLS.includes(shell as Shell)) {
    exitWithError(`unsupported shell "${shell}" (supported: ${SHELLS.join(', ')})`)
  }

  let script = ''
  switch (shell) {
    case 'bash':
      script = generateBash()
      break
    case 'zsh':
      script = generateZsh()
      break
    case 'fish':
      script = generateFish()
      break
    default:
      exitWithError('unsupported shell')
  }

  console.log(script.trim())
}

const completionHelp = createHelp({
  name: 'completion',
  description: 'Generate shell auto-completion scripts',
  usage: 'dt completion <bash|zsh|fish>',
  examples: [
    { cmd: 'dt completion bash', desc: 'Print bash completion script' },
    { cmd: 'dt completion zsh', desc: 'Print zsh completion script' },
    { cmd: 'dt completion fish', desc: 'Print fish completion script' },
  ],
})

export const completionCommand: Command = {
  name: 'completion',
  aliases: [],
  category: 'utility',
  description: 'Generate shell auto-completion scripts',
  run: completion,
  help: completionHelp,
}
