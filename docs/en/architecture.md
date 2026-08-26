# Architecture Overview

## High-Level Design

Launchpad is a hybrid web application that combines a Next.js frontend with a Node.js backend API to provide a desktop-like experience for managing local development applications.

```
┌─────────────────┐    HTTP/API    ┌─────────────────────┐
│   Browser UI    │ ◀─────────────▶ │   Next.js Server    │
│  (React Client) │                │   (API Routes)      │
└─────────────────┘                └──────────┬──────────┘
                                               │
                                               ▼
                                       ┌─────────────────┐
                                       │  File System    │
                                       │  & Process Mgmt │
                                       └─────────────────┘
                                               │
                                               ▼
                                       ┌─────────────────┐
                                       │  Child Processes│
                                       │  (npm run dev)  │
                                       └─────────────────┘
```

## Technology Stack

### Frontend
- **Next.js 16** (App Router) with React 19
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Server-Sent Events** for live log streaming
- **localStorage** for persistent UI state (path, language)

### Backend
- **Next.js API Routes** (Node.js server)
- **TypeScript** for type safety
- **Child Process API** (`child_process.spawn`) for application management
- **File System Watching** for log tailing (simulated via polling)
- **No external dependencies** — all logic runs in the Node.js process

## Key Components

### 1. Application Discovery (`lib/discover.ts`)
- Recursively scans the configured projects directory
- Identifies directories containing `package.json` with a `dev` script
- Extracts metadata: name, framework, tags, git info, timestamps
- Returns cached list of `AppInfo` objects
- Debounced to prevent excessive file system scanning

### 2. Process Management (API routes in `app/api/apps/*`)
- **Start** (`/api/apps/start`): Spawns `npm run dev` in app directory
  - Uses `child_process.spawn` with detached stdio pipes
  - Captures PID and associates with directory
  - Begins log tailing process
- **Stop** (`/api/apps/kill`): Terminates process group
  - Sends SIGTERM, falls back to SIGKILL after timeout
  - Cleans up process tracking
- **Health Check**: Polls port listening or custom health endpoint
- **Workspace Support**: Groups applications for collective start/stop

### 3. Log Management (`app/api/apps/logs/*`)
- **Log Tailing**: Simulated `tail -f` via polling
  - Opens log file when process starts
  - Reads new lines at intervals (250ms)
  - Sends via SSE to connected clients
- **Log Buffer**: In-memory circular buffer (last 500 lines)
- **Level Detection**: Pattern matching for error/warn/debug/info
- **SSE Streaming**: Server-Sent Events for real-time updates
- **Download/Clear**: File I/O operations for log persistence

### 4. Settings & Persistence (`lib/root.ts`, `app/api/settings/*`)
- **Path Resolution**: Priority: query param → localStorage → env var → default
- **Validation**: Checks path exists and is directory
- **Storage**: `localStorage.launchpad.root` and `launchpad.lang`
- **Fallback Chain**: Provides graceful degradation

### 5. Internationalization (`lib/i18n.ts`)
- **Dictionary**: English and Czech translations
- **Detection**: Reads from `localStorage` or defaults to English
- **Helper**: `translate(lang, key, ...args)` function
- **Components**: Wrap with `useCallback((k, ...a) => t(lang, k, ...a), [lang])`

### 6. UI Components (`app/page.tsx`)
- **Header**: Stats, controls, language toggle, settings
- **Application Grid**: Responsive cards showing app status/actions
- **Omnibar**: Ctrl+K fuzzy search across name/path/tags
- **Workspaces**: Quick-launch groups of applications
- **Logs Drawer**: Live log stream with filtering and controls
- **Footer**: Discovery path and helpful tips

## Data Flow

### Application Listing
1. UI requests `/api/apps?root=<path>` on mount and refresh
2. API calls `discoverApps(root)` from `lib/discover.ts`
3. Function scans filesystem and returns `AppInfo[]`
4. UI renders cards with metadata and status indicators

### Starting an Application
1. User clicks "Start" button on app card
2. UI POSTs to `/api/apps/start` with `{ dir }`
3. API validates directory and spawns child process:
   ```typescript
   const proc = spawn('npm', ['run', 'dev'], {
     cwd: dir,
     stdio: ['ignore', 'pipe', 'pipe']
   })
   ```
4. API begins tailing stdout/stderr to log file
5. UI polls for status update or listens to SSE for logs

### Streaming Logs
1. User clicks "Log" button on app card
2. UI opens SSE connection to `/api/apps/logs/stream?dir=<encoded>`
3. API tails the application's log file:
   - Opens file in follow mode (seek to end)
   - Reads new lines at intervals
   - Detects log level via pattern matching
   - Sends SSE event: `data: {timestamp, level, line}\n\n`
4. UI appends lines to log display with color coding
5. User can pause/resume stream client-side

### Settings Update
1. User enters path in settings modal and clicks Save
2. UI POSTs to `/api/settings` with `{ value }`
3. API validates path with `fs.stat()` and `fs.access()`
4. On success: saves to `localStorage.launchpad.root`
5. UI resets and triggers new app discovery with updated path

## Security Considerations

### Path Validation
All file system operations validate that paths:
- Are absolute and normalized
- Are within the configured projects root or subdirectories
- Are readable and accessible directories
- Prevent directory traversal via `path.resolve()` checks

### Process Security
- Child processes run with same privileges as Launchpad process
- No elevated privileges or sandbox escaping
- stdio is restricted: stdin ignored, stdout/stderr piped to logs
- Process groups are used for clean termination

### Network Exposure
- By default binds to localhost only (can be changed via PORT env)
- No authentication — assumes trusted local environment
- CORS restrictions not needed for same-origin use
- SSE connections are same-origin only

## Performance Characteristics

### Startup Time
- Initial discovery: O(n) where n = number of directories scanned
- Debounced to 300ms to prevent excessive scanning during typing
- Process spawn: ~100-500ms depending on framework startup time

### Memory Usage
- Application metadata: ~1-2KB per app
- Log buffer: 500 lines × ~100 chars = ~50KB per active log view
- UI state: Minimal React component state
- No large caches or data duplication

### Scaling Limits
- Tested with 100+ applications simultaneously
- UI performance degrades gracefully with virtualization potential
- Log streaming bandwidth: ~1-10KB/s per active stream
- File descriptor limits: One log tail per active stream

## Extensibility Points

### Adding New Framework Detection
Modify `detectFramework()` in `lib/discover.ts`:
```typescript
if (deps.has('svelte') || devDeps.has('svelte')) return 'svelte';
```

### Adding New Log Levels
Update `detectLevel()` in `lib/log-level.ts`:
```typescript
const CUSTOM_PATTERNS = [/\\bcustom\\b/i];
```

### Adding New Workspace Types
Modify workspace handling in:
- `app/api/apps/workspace/route.ts`
- UI components in `app/page.tsx`

### Changing Default Projects Folder
Modify `DEFAULT_ROOT` in `lib/root.ts`:
```typescript
const DEFAULT_ROOT = path.join(os.homedir(), 'projects');
```

### Adding New UI Themes
Extend Tailwind configuration in `tailwind.config.js`:
- Add new color palette
- Add new spacing scale
- Modify Typography plugin

## Deployment Notes

Although designed for local use, Launchpad can be deployed:
- **Docker**: Containerize with Node.js base image
- **Vercel/Netlify**: As a static site with serverless functions (API routes)
- **Traditional Server**: Node.js server with PM2 or systemd
- **Important**: Bind to localhost only or implement authentication for remote access

The application is deliberately designed to run on the user's machine with direct file system access for optimal performance and simplicity.
