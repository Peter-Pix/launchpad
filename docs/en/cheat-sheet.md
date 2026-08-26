# Launchpad Cheat Sheet

## Keyboard Shortcuts
- `Ctrl+K` — Focus search (omnibar)
- `Esc` — Close search/settings/logs
- `Enter` (in omnibar) — Start selected app
- `↑`/`↓` — Navigate in omnibar/search results
- `←`/`→` — Switch between tabs in settings (if expanded)

## URL Patterns
- Base: `http://localhost:3005`
- Apps list: `/api/apps?root=<path>`
- Start app: `POST /api/apps/start` + `{ "dir": "/path/to/app" }`
- Stop app: `POST /api/apps/kill` + `{ "dir": "/path/to/app" }`
- Log stream: `GET /api/apps/logs/stream?dir=<encoded>`
- Settings: `GET /api/settings` or `POST /api/settings` + `{ "value": "/path" }`

## Common API Responses

### App Object
```json
{
  "id": "hash",
  "name": "app-name",
  "dir": "/full/path/to/app",
  "framework": "next|vite|node|other",
  "tags": ["web", "frontend"],
  "running": true,
  "healthy": true,
  "port": 3000,
  "portConflict": false,
  "createdAt": 1724659200,
  "lastCommit": 1724659200,
  "url": "http://localhost:3000"
}
```

### Log Entry (SSE)
```
data: {"timestamp":1724659200,"level":"info","line":"ready - started server on http://localhost:3000"}

```

### Settings
```json
{ "root": "/home/user/projects" }
```

## Environment Variables
- `LAUNCHPAD_ROOT` — Override default projects folder (`~/projects`)
- `PORT` — Change Launchpad's port (default 3005)

## Local Storage Keys
- `launchpad.root` — Custom projects path
- `launchpad.lang` — UI language (`en` or `cs`)

## File Structure Highlights
- `app/page.tsx` — Main UI
- `app/api/apps/*` — Application management
- `app/api/apps/logs/*` — Log management
- `app/api/settings/route.ts` — Settings endpoint
- `lib/discover.ts` — Auto-discovery logic
- `lib/i18n.ts` — Internationalization
- `lib/root.ts` — Path resolution and validation
- `lib/log-level.ts` — Log level detection

## Quick Commands
```bash
# Development
npm run dev          # Start dev server
npm run build        # Create production build
npm start            # Start production server
npx tsc --noEmit     # TypeScript check
npm run type-check   # Alias for above

# Debugging
curl http://localhost:3005/api/apps          # List apps
curl -X POST http://localhost:3005/api/apps/start -H "Content-Type: application/json" -d '{"dir":"/path/to/app"}'  # Start app
```

## Troubleshooting Quick Fixes

### No Apps Found
1. Check settings (⚙️) for correct path
2. Verify folders have `package.json` with `dev` script
3. Try refresh button (↻)
4. Check console for permission errors

### Port Conflicts
- Change app's port or stop conflicting process
- Launchpad shows ⚠️ warning on affected cards

### Logs Not Updating
- Check if paused (⏸ button in logs drawer)
- Close and reopen logs drawer
- Verify app process is still running

### Settings Not Saving
- Verify path exists and is readable
- Check browser console for storage errors
- Try clearing site data and reloading

## Framework Detection
Launchpad auto-detects framework from dependencies:
- `next` → Next.js
- `vite` → Vite
- `node` → Node.js (no specific framework)
- `other` → Everything else

## Log Levels
- `info` — General information (gray)
- `warn` — Warnings (orange)
- `error` — Errors (red)
- `debug` — Debug information (blue)

## Metadata Shown on App Cards
- **Name**: From `package.json` or directory name
- **Framework**: Auto-detected badge
- **Tags**: From `package.launchpad.tags` or `keywords`
- **Status**: ● running healthy, ● unhealthy, ○ stopped
- **Last Commit**: Relative time (if git repo)
- **Created**: Relative time (filesystem ctime)
- **URL**: Detected or from `package.launchpad.url`
- **Port**: Detected listening port
- **Conflict**: ⚠️ if port is in use

## Workspace Format
Workspaces are defined in code (not user-configurable yet):
```typescript
{
  name: "workspace-name",
  apps: ["app-id-1", "app-id-2"] // Array of application IDs
}
```
Defined in `app/page.tsx` workspaces array.

## Version Information
- Check `package.json` for version
- Footer shows build timestamp in development
- API version tied to app version

## Limits and Constraints
- Maximum log buffer: 500 lines per application
- Default scan depth: Unlimited (recursive)
- Recommended max concurrent apps: 50+ (tested to 100+)
- File descriptor limit: One log tail per active stream
- Input validation: All paths checked for traversal attacks
