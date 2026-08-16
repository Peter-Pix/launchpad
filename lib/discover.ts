import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

export interface AppInfo {
  id: string;
  name: string;
  dir: string;
  path: string;
  framework: 'next' | 'vite' | 'node' | 'other';
  devScript: string;
  port: number | null;
  running: boolean;
  healthy: boolean | null; // null = neznámý (neběží / bez portu)
  url: string | null;
  hasPackageJson: boolean;
  portConflict: boolean;
  icon: string | null;      // emoji nebo URL
  tags: string[];           // kategorie
  workspaces: string[];     // názvy workspace, do kterých patří
}

const PROJECTS_ROOT = process.env.LAUNCHPAD_ROOT || join(process.env.HOME || '', 'projects');

/** Získá seznam běžících dev procesů JEDNÍM voláním ps aux. */
function getRunningDirs(): Set<string> {
  const running = new Set<string>();
  try {
    const out = execSync(
      `ps aux | grep -iE "next|vite|node|tsx" | grep -v grep`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 10 * 1024 * 1024 }
    );
    const root = PROJECTS_ROOT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    for (const line of out.split('\n')) {
      const m = line.match(new RegExp(`${root}/([^/\\s]+)`));
      if (m) running.add(m[1]);
    }
  } catch {}
  return running;
}

/** Získá Set obsazených portů JEDNÍM voláním lsof. */
function getBusyPorts(): Set<number> {
  const busy = new Set<number>();
  try {
    const out = execSync(
      `lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null | awk '{print $9}' | grep -oE '[0-9]+$'`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 5 * 1024 * 1024 }
    );
    for (const line of out.split('\n')) {
      const p = parseInt(line, 10);
      if (!isNaN(p)) busy.add(p);
    }
  } catch {}
  return busy;
}

/** Vytáhne port z dev scriptu (např. "next dev -p 8888" → 8888). */
function portFromScript(script: string): number | null {
  const m = script.match(/(?:-p|--port)[= ](\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function detectFramework(pkg: any): AppInfo['framework'] {
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  if (deps.next) return 'next';
  if (deps.vite) return 'vite';
  if (deps['tsx'] || deps.express || deps.fastify) return 'node';
  return 'other';
}

/** Rychlý HTTP health-check — vrátí true, pokud server odpoví 2xx/3xx. */
function checkHealth(url: string): boolean {
  try {
    const out = execSync(
      `curl -s -o /dev/null -w "%{http_code}" --max-time 2 "${url}"`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000 }
    );
    const code = parseInt(out.trim(), 10);
    return !isNaN(code) && code >= 200 && code < 400;
  } catch {
    return false;
  }
}

export function discoverApps(): AppInfo[] {
  if (!existsSync(PROJECTS_ROOT)) return [];

  // Jedno volání ps aux + jedno lsof pro všechny aplikace
  const runningDirs = getRunningDirs();
  const busyPorts = getBusyPorts();

  const apps: AppInfo[] = [];
  for (const dir of readdirSync(PROJECTS_ROOT)) {
    const full = join(PROJECTS_ROOT, dir);
    const pkgPath = join(full, 'package.json');
    if (!existsSync(pkgPath)) continue;

    let pkg: any = {};
    try {
      pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    } catch {
      continue;
    }

    const devScript = pkg.scripts?.dev || '';
    const framework = detectFramework(pkg);
    const configuredPort = portFromScript(devScript);
    // Priorita: launchpad.port (explicitní) > port z dev scriptu > framework default
    const port = pkg.launchpad?.port ?? configuredPort ?? (framework === 'vite' ? 5173 : framework === 'next' ? 3000 : null);
    const running = runningDirs.has(dir);
    const portConflict = !running && port !== null && busyPorts.has(port);
    const url = port !== null ? `http://localhost:${port}` : null;

    // Health-check jen pro běžící aplikace s portem (neblokuje discovery)
    let healthy: boolean | null = null;
    if (running && url) {
      healthy = checkHealth(url);
    }

    // Launchpad-specific metadata z package.json
    const lp = pkg.launchpad || {};
    const tags = Array.isArray(lp.tags) ? lp.tags.map(String) : [];
    const workspaces = Array.isArray(lp.workspaces) ? lp.workspaces.map(String) : [];

    apps.push({
      id: dir,
      name: pkg.name || dir,
      dir,
      path: full,
      framework,
      devScript,
      port,
      running,
      healthy,
      url,
      hasPackageJson: true,
      portConflict,
      icon: typeof lp.icon === 'string' ? lp.icon : null,
      tags,
      workspaces,
    });
  }

  // Seřadit: běžící první, pak abecedně
  return apps.sort((a, b) => {
    if (a.running !== b.running) return a.running ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}
