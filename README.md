# 🚀 Launchpad

A central launcher for all your local dev apps. Point it at a folder, and it **auto-discovers** every project with a `package.json` dev script — no manual registry, no config files. See what's running, start/stop apps, stream live logs, and launch whole workspaces with one click.

Built for localhost. Runs entirely on your machine.

![Rocket icon](assets/icon.svg)

## ✨ Features

- **Auto-discovery** — drop a new project into your projects folder, it appears automatically. No registration.
- **Live status** — running/stopped, port, framework, health-check, last commit, created date.
- **One-click start/stop** — `npm run dev` on the background, opens the app in a new tab.
- **Port conflict detection** — warns and blocks start if the port is taken by another app.
- **Omnibar** — `Ctrl+K` to search and launch from the keyboard.
- **Workspaces** — group apps by `launchpad.workspaces` and start them all at once.
- **Live logs** — bottom drawer with streaming logs, level filters, download & clear.
- **Configurable projects path** — set your own folder via the ⚙️ gear icon (persisted in your browser).

## 🚀 Quick start

```bash
git clone git@github.com:Peter-Pix/launchpad.git
cd launchpad
npm install
npm run dev   # → http://localhost:3005
```

Open http://localhost:3005. Launchpad scans your projects folder and shows everything.

> **Tip:** double-click `Launchpad.app` / `Launchpad.command` on your Desktop to start the server and open the browser in one step.

## ⚙️ Setting your projects path

By default Launchpad scans `~/projects`. To point it elsewhere:

1. Click the **⚙️ gear icon** in the top-right corner.
2. Enter the absolute path to your projects folder (e.g. `/Users/you/code`).
3. Click **Save**.

The path is stored in your browser (`localStorage`) and sent with every request. You can also set it once via the `LAUNCHPAD_ROOT` environment variable — the UI setting takes precedence.

## 🧩 Per-app config

Add a `launchpad` block to any project's `package.json` to customize how it appears:

```json
{
  "name": "my-app",
  "scripts": { "dev": "next dev -p 8888" },
  "launchpad": {
    "icon": "🎵",
    "port": 8888,
    "tags": ["music", "production"],
    "workspaces": ["AI Suite"],
    "healthPath": "/api/health",
    "healthExpected": [200, 401]
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `icon` | string | Emoji or URL shown on the card |
| `port` | number | Override the port (else parsed from the dev script) |
| `tags` | string[] | Filter chips |
| `workspaces` | string[] | Group apps to start together |
| `healthPath` | string | Custom health-check path |
| `healthExpected` | number[] | HTTP codes that count as healthy |

## 🔒 Security

**Launchpad is designed for localhost use only.** Every state-changing action (start, stop, clear logs, launch workspace) is guarded — the API only accepts requests from `127.0.0.1` / `::1` / `localhost`.

**Do not run Launchpad on a public server.** It can execute arbitrary code in your projects folder. Keep it local.

## 🗂 Project structure

```
app/
  page.tsx                    # UI grid, omnibar, log drawer, settings
  api/apps/route.ts           # GET — list apps
  api/apps/start/route.ts     # POST — start an app
  api/apps/kill/route.ts      # POST — stop an app
  api/apps/workspace/route.ts # POST — start a workspace
  api/apps/logs/…             # stream / clear / download logs
  api/apps/health/route.ts    # GET — health-check
  api/settings/route.ts       # GET/POST — validate projects path
lib/
  discover.ts                 # auto-discovery + health-check
  root.ts                     # resolve projects root (env / UI setting)
  guard.ts                    # localhost protection
  log-level.ts                # log line level detection
```

## 🛠 Tech

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- Server-side discovery via `fs` + `ps`/`lsof`
- SSE for live log streaming
- No database, no external services — everything is local

## 📄 License

MIT — use it, fork it, ship it.

---

Made for developers who keep a folder full of side projects and want them all one click away.
