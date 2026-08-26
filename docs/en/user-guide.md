# Launchpad User Guide

## Overview

Launchpad is a central launcher for all your local development applications. It automatically discovers projects with `package.json` dev scripts, shows their status, lets you start/stop them with one click, streams live logs, and launches workspaces — all without manual configuration.

## Installation

```bash
git clone https://github.com/Peter-Pix/launchpad.git
cd launchpad
npm install
```

## First Run

By default, Launchpad scans your `~/projects` directory for applications. To use a different folder:

1. Click the ⚙️ gear icon in the top-right corner
2. Enter the path to your projects folder (e.g., `/Users/you/code`)
3. Click "Save"
4. Launchpad will automatically rescan

You can also set the `LAUNCHPAD_ROOT` environment variable before starting:
```bash
LAUNCHPAD_ROOT=/mnt/development npm run dev
```

## Interface Overview

### Header
- **🚀 Launchpad** — title
- **Stats pills** — total apps, running apps, port conflicts
- **Auto-open toggle** — automatically open apps in browser after starting
- **Language toggle** — 🇬🇧/🇨🇿 (English/Czech)
- **Settings (⚙️)** — configure projects path
- **Refresh (↻)** — manually rescan for new/changed projects

### Main View
Discoverd applications appear as cards showing:
- **App name** and **emoji icon** (based on framework detection)
- **Status indicator** (● running healthy, ● unhealthy, ○ stopped)
- **Last commit** and **creation time** (relative timestamps)
- **Framework badge** (Next.js, Vite, Node, etc.)
- **Tags** (if defined in `package.json`)
- **Action buttons**:
  - 🔗 Open — launches the app URL in a new tab
  - ⎇ Log — opens live logs drawer
  - ▶/✕ Start/Stop — toggle app state (shows "Starting…" when busy)
  - ⚠️ Port conflict warning (if applicable)

### Bottom Bar
Shows discovery path and helpful tips:
- Auto-discovery: scans `[path]` · new apps are added automatically
- Quick search · Run: `npm run dev`
- ⚙️ to change the path

### Omnibar (Ctrl+K)
Instant fuzzy search across:
- Application names
- Directory paths
- Tags (from `package.json`)
Press **Enter** to start the selected application.

### Workspaces (⚡)
Defined groups of applications that can be started/stopped together.
Click a workspace to launch all its member apps with one click.

### Logs Drawer
Opens when you click the ⎇ Log button on an app card:
- **Header**: App name and directory path
- **Live log stream** with color-coded levels (info/gray, warn/orange, error/red, debug/blue)
- **Controls**:
  - ▶ Resume / ⏸ Pause — toggle log streaming
  - ⤓ Download — save logs as plain text file
  - 🗑 Clear — clear the log buffer
  - ✕ Close — close the drawer
- **Filter chips**: All / INFO / WARN / ERROR / DEBUG
- **Empty state**: Shows message when no logs are available

## Settings (⚙️ Modal)
Access via the gear icon in the header:

### Projects Path
- Folder where Launchpad scans for applications
- Must be a valid, readable directory
- Saved to `localStorage` as `launchpad.root`
- Reset to default with the "↺ Default" button

### Auto-Open
When enabled, Launchpad automatically opens the application's URL in a new browser tab after starting it.

### Language
Toggle between English (🇬🇧) and Czech (🇨🇿) for the entire UI. Selection persists in `localStorage`.

## Keyboard Shortcuts
- **Ctrl+K** — Focus the omnibar (search)
- **Esc** — Close omnibar, settings modal, or logs drawer
- **Enter** (in omnibar) — Start the selected application

## How It Works

### Application Discovery
Launchpad recursively scans the configured projects folder for:
- Directories containing a `package.json` file
- That package.json has a `dev` script in the `scripts` object

Each discovered application is cached with metadata:
- Name (from `package.json.name` or directory name)
- Framework (detected from dependencies: next, vite, node, or other)
- Git info (last commit timestamp, if it's a git repository)
- Creation time (filesystem ctime)
- Tags (from `package.launchpad.tags` array or `package.json.keywords`)

### Process Management
When you click "Start":
1. Launchpad spawns a child process running `npm run dev` in the app's directory
2. It captures the process's stdout/stderr for live logging
3. It polls the app's health endpoint (if available) or uses port listening as a heuristic
4. The process is tracked by its PID and associated port

When you click "Stop":
1. Launchpad sends SIGTERM to the process group
2. Waits for graceful shutdown (falls back to SIGKILL after timeout)
3. Cleans up the process tracking

### Live Logs
Logs are streamed via Server-Sent Events (SSE) from the `/api/apps/logs/stream` endpoint:
- The backend tails the application's log file (created when the process starts)
- New lines are sent to the client as they appear
- Log levels are detected using pattern matching (error/warn/debug/info)
- Clients can pause/resume the stream without reconnecting

## Configuration

### Environment Variables
- `LAUNCHPAD_ROOT` — Override default projects folder (`~/projects`)
- `PORT` — Change Launchpad's own port (default 3005)

### Persisted Settings
Stored in `browser.localStorage`:
- `launchpad.root` — Custom projects path
- `launchpad.lang` — UI language (`en` or `cs`)

## Troubleshooting

### "No apps found"
1. Verify the projects path in settings (⚙️) is correct
2. Ensure directories contain a `package.json` with a `dev` script
3. Check console for permission errors accessing the folder
4. Try clicking the refresh button (↻)

### Port conflicts
- Launchpad detects when an app's configured port is already in use
- The app card shows a ⚠️ warning and won't allow starting
- Either stop the conflicting process or change the app's port

### Apps not showing as running
- Some frameworks don't expose a reliable health endpoint
- Launchpad falls back to "listening on port" detection
- Check the live logs to confirm the app actually started
- Manual verification: open the app's URL in a browser

### Live logs not updating
- Ensure you haven't accidentally paused the stream (⏸ button)
- Try closing and reopening the logs drawer
- Check that the app process is still running (status indicator)

## Contributing

See [CONTRIBUTING.en.md](docs/en/contributing.md) for detailed contributor guide.

## License

MIT — see [LICENSE](LICENSE) file.

© 2026 Peter Piskáček
