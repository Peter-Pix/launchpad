import { execSync, spawn, type ChildProcess } from 'child_process';
import { existsSync, openSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Správa dev procesů — robustní detekce běhu, okamžité chyby startu,
 * čištění mrtvých procesů a stale portů.
 */

/** Zjistí, zda na daném portu naslouchá nějaký proces. */
export function isPortBusy(port: number): boolean {
  try {
    const out = execSync(
      `lsof -iTCP:${port} -sTCP:LISTEN -P -n 2>/dev/null | wc -l`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }
    );
    return parseInt(out.trim(), 10) > 0;
  } catch {
    return false;
  }
}

/** Zjistí PID procesu naslouchajícího na portu (nebo null). */
export function getPortPid(port: number): number | null {
  try {
    const out = execSync(
      `lsof -tiTCP:${port} -sTCP:LISTEN -P -n 2>/dev/null | head -1`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }
    );
    const pid = parseInt(out.trim(), 10);
    return isNaN(pid) ? null : pid;
  } catch {
    return null;
  }
}

/** Zjistí, zda proces s daným PID běží. */
export function isPidAlive(pid: number): boolean {
  try {
    execSync(`kill -0 ${pid} 2>/dev/null`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/** Zjistí, zda je cwd procesu s daným PID rovno danému adresáři. */
export function pidCwdMatches(pid: number, dir: string): boolean {
  try {
    const out = execSync(
      `lsof -a -p ${pid} -d cwd -Fn 2>/dev/null | grep '^n' | head -1`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }
    );
    const cwd = out.trim().replace(/^n/, '');
    return cwd === dir;
  } catch {
    return false;
  }
}

/**
 * Robustní detekce běhu aplikace.
 * Aplikace běží, pokud:
 *  - její dev proces je v `ps aux` (cwd match), NEBO
 *  - na jejím portu naslouchá proces, jehož cwd odpovídá adresáři aplikace
 */
export function isAppRunning(dir: string, port: number | null): boolean {
  // 1) Procesová detekce přes ps aux (cwd match)
  try {
    const out = execSync(
      `ps aux | grep -iE "next|vite|node|tsx|npm" | grep -v grep | grep -F "${dir}"`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 5 * 1024 * 1024 }
    );
    if (out.trim().length > 0) return true;
  } catch {}

  // 2) Portová detekce — proces na portu má cwd = adresář aplikace
  if (port !== null) {
    const pid = getPortPid(port);
    if (pid !== null && isPidAlive(pid) && pidCwdMatches(pid, dir)) return true;
  }

  return false;
}

/**
 * Spustí dev proces a počká na okamžitou chybu (chybí deps, špatný script).
 * Vrací { child, error } — error je vyplněn, pokud proces skončil okamžitě.
 */
export async function startDevProcess(
  appPath: string,
  logPath: string,
  waitMs = 1500
): Promise<{ child: ChildProcess; error: string | null }> {
  const logFd = openSync(logPath, 'a');
  const child = spawn('npm', ['run', 'dev'], {
    cwd: appPath,
    detached: true,
    stdio: ['ignore', logFd, logFd],
    env: { ...process.env },
  });
  child.unref();

  // Detekce okamžitého selhání: počkáme krátce a zkontrolujeme exit code
  const error = await new Promise<string | null>((resolve) => {
    const timer = setTimeout(() => resolve(null), waitMs);
    child.once('exit', (code) => {
      clearTimeout(timer);
      resolve(
        code === 0
          ? 'Proces skončil okamžitě (exit 0) — zkontroluj dev script'
          : `Proces skončil okamžitě s kódem ${code} — chybí závislosti nebo je špatný dev script`
      );
    });
    child.once('error', (err) => {
      clearTimeout(timer);
      resolve(`Nepodařilo se spustit proces: ${err.message}`);
    });
  });

  return { child, error };
}

/**
 * Zastaví dev proces a vyčistí stale port.
 * Vrací počet zabitých procesů.
 */
export function killAppProcesses(appPath: string, port: number | null): number {
  let killed = 0;

  // 1) Zabij procesy patřící adresáři
  try {
    const pids = execSync(
      `ps aux | grep -iE "next|vite|node|tsx|npm" | grep -v grep | grep -F "${appPath}" | awk '{print $2}'`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim().split('\n').filter(Boolean);

    if (pids.length > 0) {
      killed += pids.length;
      try { execSync(`kill ${pids.join(' ')} 2>/dev/null || true`, { stdio: 'ignore' }); } catch {}
      try { execSync(`sleep 1; kill -9 ${pids.join(' ')} 2>/dev/null || true`, { stdio: 'ignore' }); } catch {}
    }
  } catch {}

  // 2) Vyčisti stale port — pokud na portu naslouchá proces, který
  //    patří tomuto adresáři, zabij ho (mrtvý proces z dřívějška)
  if (port !== null) {
    const pid = getPortPid(port);
    if (pid !== null && isPidAlive(pid) && pidCwdMatches(pid, appPath)) {
      try { execSync(`kill ${pid} 2>/dev/null || true`, { stdio: 'ignore' }); } catch {}
      try { execSync(`sleep 1; kill -9 ${pid} 2>/dev/null || true`, { stdio: 'ignore' }); } catch {}
      killed++;
    }
  }

  return killed;
}

/** Ověří, že adresář má platný package.json s dev scriptem. */
export function validateAppDir(appPath: string): { ok: boolean; error?: string } {
  const pkgPath = join(appPath, 'package.json');
  if (!existsSync(pkgPath)) {
    return { ok: false, error: `Nenalezen package.json v ${appPath}` };
  }
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    if (!pkg.scripts?.dev) {
      return { ok: false, error: `Chybí dev script v package.json (${appPath})` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: `Neplatný package.json v ${appPath}` };
  }
}
