# flake-init

Interactive CLI for generating a Nix flake dev environment. It guides you through choosing a template, supported systems, and language-specific packages, then writes a `flake.nix` (and optionally a `.envrc`).

## Features

- Select a flake template (`base` or `flake-parts`)
- Choose supported systems (Linux/macOS, Intel/ARM)
- Pick a language preset (currently Node.js) and package manager
- Optional `.envrc` creation for direnv

## Usage

Run the latest release (macOS/Linux):

```bash
curl -fsSL https://raw.githubusercontent.com/ShoeBoom/flake-init/main/run.sh | sh -s --
```

Run from source:

```bash
bun install
bun run src/index.ts
```

## Development

```bash
bun run start
```
