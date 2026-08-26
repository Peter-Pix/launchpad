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

  const dir = body?.dir;
  if (!dir) return NextResponse.json({ error: 'Chybí dir' }, { status: 400 });

  const root = resolveRoot(req);
  const appPath = join(root, dir);
  if (!existsSync(join(appPath, 'package.json'))) {
    return NextResponse.json({ error: `Nenalezen package.json v ${dir}` }, { status: 404 });
  }

  const apps = discoverApps(root);
  const app = apps.find((a) => a.dir === dir);
  if (app?.running) {
    return NextResponse.json({ ok: true, alreadyRunning: true, url: app.url });
  }

  const logPath = join(appPath, '.launchpad.log');
  const logFd = openSync(logPath, 'a');
  const child = spawn('npm', ['run', 'dev'], {
    cwd: appPath,
    detached: true,
    stdio: ['ignore', logFd, logFd],
    env: { ...process.env },
  });
  child.unref();

  return NextResponse.json({ ok: true, started: true, dir, log: logPath });
}
