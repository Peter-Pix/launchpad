import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { existsSync, openSync } from 'fs';
import { join } from 'path';
import { discoverApps } from '@/lib/discover';
import { assertLocalhost } from '@/lib/guard';
import { resolveRoot } from '@/lib/root';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const guard = assertLocalhost(req);
  if (guard) return guard;

  let body: any = {};
  try { body = await req.json(); } catch {}

  const dirs: string[] = Array.isArray(body?.dirs) ? body.dirs : [];
  if (dirs.length === 0) {
    return NextResponse.json({ error: 'Chybí dirs' }, { status: 400 });
  }

  const root = resolveRoot(req);
  const apps = discoverApps(root);
  const results: Record<string, any> = {};

  for (const dir of dirs) {
    const appPath = join(root, dir);
    if (!existsSync(join(appPath, 'package.json'))) {
      results[dir] = { ok: false, error: 'Nenalezen package.json' };
      continue;
    }

    const app = apps.find((a) => a.dir === dir);
    if (app?.running) {
      results[dir] = { ok: true, alreadyRunning: true, url: app.url };
      continue;
    }

    try {
      const logPath = join(appPath, '.launchpad.log');
      const logFd = openSync(logPath, 'a');
      const child = spawn('npm', ['run', 'dev'], {
        cwd: appPath,
        detached: true,
        stdio: ['ignore', logFd, logFd],
        env: { ...process.env },
      });
      child.unref();
      results[dir] = { ok: true, started: true, log: logPath };
    } catch (e: any) {
      results[dir] = { ok: false, error: e.message };
    }
  }

  return NextResponse.json({ ok: true, results });
}
