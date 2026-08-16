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
  url: string | null;
  hasPackageJson: boolean;
  portConflict: boolean;
}

const PROJECTS_ROOT = process.env.LAUNCHPAD_ROOT || join(process.env.HOME || '', 'projects');

/**
 * Zjistí, jestli běží dev proces pro daný adresář.
 * Používá `[d]ir` regex trik, aby se grep neshodoval sám se sebou
 * (command line execSync obsahuje dir, což by jinak dalo falešný pozitiv).
 */
function isAppRunning(dir: string): boolean {
  const escaped = dir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = escaped.replace(/^./, (c) => `[${c}]`);
  try {
    const out = execSync(
      `ps aux | grep -iE "next|vite|node|tsx" | grep -v grep | grep -E "${pattern}"`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }
    );
    return out.trim().length > 0;
  } catch {
    return false;
  }
}

/** Zjistí, jestli port naslouchá (kýmkoliv). */
function isPortBusy(port: number): boolean {
  try {
    execSync(`lsof -iTCP:${port} -sTCP:LISTEN -P -n 2>/dev/null | grep -q LISTEN`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
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

export function discoverApps(): AppInfo[] {
  if (!existsSync(PROJECTS_ROOT)) return [];

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
    const running = isAppRunning(dir);
    const portConflict = !running && port !== null && isPortBusy(port);

    apps.push({
      id: dir,
      name: pkg.name || dir,
      dir,
      path: full,
      framework,
      devScript,
      port,
      running,
      url: port !== null ? `http://localhost:${port}` : null,
      hasPackageJson: true,
      portConflict,
    });
  }

  // Seřadit: běžící první, pak abecedně
  return apps.sort((a, b) => {
    if (a.running !== b.running) return a.running ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}
