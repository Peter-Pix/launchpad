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
  healthy: boolean | null;
  url: string | null;
  hasPackageJson: boolean;
  portConflict: boolean;
  icon: string | null;
  tags: string[];
  workspaces: string[];
  healthPath: string | null;
  healthExpected: number[];
  lastCommit: number | null; // unix timestamp posledního commitu
  createdAt: number | null;   // unix timestamp prvního commitu
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


/** Získá last commit a created at (první commit) pro projekt jedním git log voláním. */
function getGitTimestamps(dir: string): { lastCommit: number | null; createdAt: number | null } {
  try {
    const out = execSync(
      `git -C "${dir}" log --format="%ct" 2>/dev/null`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 2 * 1024 * 1024 }
    );
    const lines = out.trim().split('\n').filter(Boolean).map(Number).filter((n) => !isNaN(n));
    if (lines.length === 0) return { lastCommit: null, createdAt: null };
    return { lastCommit: lines[0], createdAt: lines[lines.length - 1] };
  } catch {
    return { lastCommit: null, createdAt: null };
  }
}

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

function normalizeExpected(expected: unknown): number[] {
  if (!expected) return [];
  if (Array.isArray(expected)) return expected.filter((x) => typeof x === 'number') as number[];
  if (typeof expected === 'number') return [expected];
  return [];
}

export function discoverApps(): AppInfo[] {
  if (!existsSync(PROJECTS_ROOT)) return [];

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
    const port = pkg.launchpad?.port ?? configuredPort ?? (framework === 'vite' ? 5173 : framework === 'next' ? 3000 : null);
    const running = runningDirs.has(dir);
    const portConflict = !running && port !== null && busyPorts.has(port);
    const url = port !== null ? `http://localhost:${port}` : null;

    const lp = pkg.launchpad || {};
    const tags = Array.isArray(lp.tags) ? lp.tags.map(String) : [];
    const workspaces = Array.isArray(lp.workspaces) ? lp.workspaces.map(String) : [];
    const icon = typeof lp.icon === 'string' ? lp.icon : null;
    const healthPath = typeof lp.healthPath === 'string' ? lp.healthPath : null;
    const healthExpected = normalizeExpected(lp.healthExpected);

    // Git metadata (last commit + created at) — jedno volání na projekt
    const { lastCommit, createdAt } = getGitTimestamps(full);

    apps.push({
      id: dir,
      name: pkg.name || dir,
      dir,
      path: full,
      framework,
      devScript,
      port,
      running,
      healthy: null,
      url,
      hasPackageJson: true,
      portConflict,
      icon,
      tags,
      workspaces,
      healthPath,
      healthExpected,
      lastCommit,
      createdAt,
    });
  }

  return apps.sort((a, b) => {
    if (a.running !== b.running) return a.running ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

/** Defaultní health-check cesty podle frameworku. */
export function getHealthPaths(port: number, framework: AppInfo['framework'], customPath: string | null): string[] {
  if (customPath) return [customPath];
  const defaults = ['/', '/api/health', '/health'];
  if (framework === 'next') return ['/', '/api/health', '/health', '/_next/static/__development'];
  if (framework === 'vite') return ['/', '/index.html', '/health'];
  return defaults;
}

/** Asynchronní HTTP check — neblokuje event loop execSyncem. */
async function fetchStatus(url: string, timeoutMs = 2000): Promise<number | null> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ac.signal });
    return res.status;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function checkAppHealth(
  port: number,
  framework: AppInfo['framework'],
  customPath: string | null,
  expectedCodes: number[]
): Promise<{ healthy: boolean; checks: { path: string; status: number | null }[] }> {
  const paths = getHealthPaths(port, framework, customPath);
  const checks: { path: string; status: number | null }[] = [];
  let healthy = false;

  for (const path of paths) {
    const status = await fetchStatus(`http://127.0.0.1:${port}${path}`);
    checks.push({ path, status });
    // Jakýkoliv HTTP kód (kromě 0/null) znamená, že server naslouchá
    if (status !== null && status !== 0) {
      if (expectedCodes.length === 0 || expectedCodes.includes(status)) {
        healthy = true;
      }
    }
  }

  return { healthy, checks };
}
