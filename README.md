# lp_kamal

Interactive CLI tool to streamline Kamal deployments with multi-project support.

## Features

- **Multi-project support** - Register and deploy multiple projects
- **Auto-discovery** - Scan directories for projects with Kamal configs
- **Git integration** - Auto checkout/fetch/pull before deploy
- **Branch-aware** - Different deploy commands per branch
- **Run from anywhere** - No need to be in project directory
- **Global config** - Works across all your repos

## Quick Install

### One-liner (macOS/Linux)

```bash
curl -fsSL https://raw.githubusercontent.com/lpwanw/lp_kamal/refs/heads/main/install.sh | bash
```

### Manual Install

```bash
git clone https://github.com/lpwanw/lp_kamal.git
cd lp_kamal
bun install
bun run build:exe

# Install to ~/.local/bin (no sudo required)
mkdir -p ~/.local/bin
mv lp_kamal ~/.local/bin/

# Add to PATH if needed (add to .zshrc or .bashrc)
export PATH="$HOME/.local/bin:$PATH"
```

## Usage

### Initial Setup

Scan a directory for projects and register them:

```bash
lp_kamal --init
```

This will:

1. Ask which directory to scan (default: current directory)
2. Find all git repos with `config/deploy*.yml` files
3. Let you select which projects to register
4. Auto-detect branches from config files
5. Save to global config

### Deploy

```bash
lp_kamal
```

This will:

1. Show project selector (if multiple projects)
2. Show branch selector
3. Checkout, fetch, and pull the branch
4. Ask for confirmation
5. Execute the deploy command

## Example Workflow

```bash
# First time setup - scan ~/projects folder
$ lp_kamal --init
┌  lp_kamal Setup
│
◇  Directory to scan: ~/projects
◐  Scanning for projects...
◇  Found 3 project(s)
│
◆  Select projects to register:
│  ◼ my-app
│  ◼ api-server
│  ◻ old-project
│
▲  Configuring my-app...
◇  Command for main: kamal deploy -c config/deploy.yml
◇  Command for staging: kamal deploy -c config/deploy.staging.yml
│
▲  Configuring api-server...
◇  Command for main: kamal deploy -c config/deploy.yml
│
◇  Config saved to ~/.config/lp_kamal/config.json
└  Setup complete

# Deploy from anywhere
$ lp_kamal
┌  lp_kamal Deploy
│
◆  Select project:
│  ● my-app
│  ○ api-server
│
◆  Select branch to deploy:
│  ● main (current)
│  ○ staging
│
◐  Fetching origin...
◇  Fetched origin
◐  Pulling main...
◇  Pulled main
│
◇  Path: /Users/me/projects/my-app
◇  Command: kamal deploy -c config/deploy.yml
◆  Deploy my-app/main? No / Yes
│
▲  Deploying...
```

## Config Pattern

| Branch | Config File | Default Command |
|--------|-------------|-----------------|
| main | `config/deploy.yml` | `kamal deploy -c config/deploy.yml` |
| staging | `config/deploy.staging.yml` | `kamal deploy -c config/deploy.staging.yml` |
| production | `config/deploy.production.yml` | `kamal deploy -c config/deploy.production.yml` |

## Config File

Global config stored at `~/.config/lp_kamal/config.json`:

```json
{
  "version": 2,
  "projects": [
    {
      "name": "my-app",
      "path": "/Users/me/projects/my-app",
      "branches": [
        { "branch": "main", "command": "kamal deploy -c config/deploy.yml" },
        { "branch": "staging", "command": "kamal deploy -c config/deploy.staging.yml" }
      ]
    }
  ]
}
```

## Commands

| Command | Description |
|---------|-------------|
| `lp_kamal` | Start deploy flow |
| `lp_kamal --init` | Scan and register projects |
| `lp_kamal --config` | Manage projects and branches |
| `lp_kamal --update` | Update to latest version |
| `lp_kamal --help` | Show help |
| `lp_kamal --version` | Show version |

## Development

```bash
# Install dependencies
bun install

# Run in development
bun run dev

# Type check
bun run typecheck

# Build executable
bun run build:exe
```

## Requirements

- [Bun](https://bun.sh) >= 1.0
- [Kamal](https://kamal-deploy.org) installed
- Git

## License

MIT
