# 🚀 Launchpad

A central launcher for all your local dev apps. Point it at a folder, and it **auto-discovers** every project with a `package.json` dev script — no manual registry, no config files. See what's running, start/stop apps, stream live logs, and launch whole workspaces with one click.

Built for localhost. Runs entirely on your machine.

## 📖 Documentation

### Quick Start
See [QUICK_START.md](QUICK_START.md) for a 30-second setup guide.

### Full Documentation
Comprehensive documentation is available in both English and Czech:

- **English**: [`docs/en/`](docs/en/)
  - [User Guide](docs/en/user-guide.md) — How to use Launchpad
  - [Contributor Guide](docs/en/contributing.md) — How to develop/contribute
  - [API Reference](docs/en/api-reference.md) — Technical API details
  - [Architecture](docs/en/architecture.md) — System design overview
  - [Development Workflow](docs/en/development.md) — Setup and best practices
  - [Cheat Sheet](docs/en/cheat-sheet.md) — Quick reference

- **Czech**: [`docs/cs/`](docs/cs/)
  - [Uživatelská příručka](docs/cs/user-guide.md) — Jak používat Launchpad
  - [Průvodce přispěvatele](docs/cs/contributing.md) — Jak vyvíjet/přispívat
  - [Referenční příručka API](docs/cs/api-reference.md) — Technické detaily API
  - [Architektura](docs/cs/architecture.md) — Přehled návrhu systému
  - [Postup vývoje](docs/cs/development.md) — Nastavení a nejlepší praktiky
  - [Cheat Sheet](docs/cs/cheat-sheet.md) — Rychlá referencia

### README Languages
- [`README.md`](README.md) — This file (English)
- [`README.cs.md`](README.cs.md) — Czech version

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/Peter-Pix/launchpad.git
cd launchpad

# Install dependencies
npm install

# Run it
npm run dev
```

Open [http://localhost:3005](http://localhost:3005) — Launchpad will auto-scan your `~/projects` folder (or change it via ⚙️ settings).

## 🔑 Features

### Auto-discovery
- Scans chosen directory (default `~/projects`)
- Finds every project with `package.json` containing a `dev` script
- Automatically detects new projects — no manual registration

### State & Control
- See app state: running, stopped, port conflict
- One-click start (`npm run dev`) or stop
- Shows port usage and warns on conflicts

### Live Logs
- Stream stdout/stderr in real time
- Color-coded log levels (info, warn, error, debug)
- Pause, download, clear logs
- Source maps (when available)

### Workspaces
- Define groups of apps to start/stop together
- Launch/stop entire workspaces with one click
- Save custom workspaces for different workflows

### Configurable Projects Path
- Click ⚙️ gear icon in top-right
- Set custom path to projects folder (e.g., `/mnt/code`, `/workspaces`)
- Saved to `localStorage` — remembers between sessions
- Fallback: `LAUNCHPAD_ROOT` env → `~/projects`

### Search & Filters (Ctrl+K)
- Instant filtering by:
  - Framework (Next.js, Vite, Node, other)
  - State (running, stopped, offline)
  - Tags (add `tags` to `package.json`)
  - Text search (name, directory, tags)
- Sorting: A–Z, last commit, created date

### Keyboard Shortcuts
- `Ctrl+K` — Focus search
- `Esc` — Close search/settings/logs
- `Enter` in omnibar — Start selected app

### Settings (⚙️)
- **Projects path** — Where Launchpad looks for apps
- **Auto-open** — Automatically open app in browser after start
- **Language UI** — English/Czech toggle (next to gear icon)

## 🛠️ Development

See [CONTRIBUTING.en.md](docs/en/contributing.md) for detailed contributor guide.

### Architecture
- **Next.js 16** (App Router) — React 19, TypeScript
- **Backend API routes** — `/api/apps/*` for app management
- **Server-Sent Events** — Live log streaming
- **Local storage** — `localStorage` for settings and language
- **Zero external DB deps** — All runs in Node.js processes

### Code Structure
```
launchpad/
├── app/                 # Next.js app router
│   ├── api/             # API route handlers
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main UI
├── lib/                 # Shared utilities
│   ├── discover.ts      # Auto-discovery
│   ├── i18n.ts          # Internationalization (EN/CZ)
│   ├── log-level.ts     # Log level detection
│   └── root.ts          # Root path configuration
├── public/              # Static assets
└── styles/              # Global CSS
```

## 📝 Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation
- `refactor:` — Code refactor
- `test:` — Tests
- `chore:` — Maintenance

## 📄 License

MIT — see [LICENSE](LICENSE) file.

© 2026 Peter Piskáček
