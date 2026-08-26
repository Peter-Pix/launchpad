import { NextResponse } from 'next/server';
import { join } from 'path';
import { discoverApps } from '@/lib/discover';
import { assertLocalhost } from '@/lib/guard';
import { resolveRoot } from '@/lib/root';
import { startDevProcess, validateAppDir } from '@/lib/process';

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

  // Validace adresáře — package.json + dev script
  const validation = validateAppDir(appPath);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const apps = discoverApps(root);
  const app = apps.find((a) => a.dir === dir);
  if (app?.running) {
    return NextResponse.json({ ok: true, alreadyRunning: true, url: app.url });
  }

  const logPath = join(appPath, '.launchpad.log');
  const { child, error } = await startDevProcess(appPath, logPath);

  if (error) {
    return NextResponse.json({ ok: false, error, dir, log: logPath }, { status: 500 });
  }

  return NextResponse.json({ ok: true, started: true, dir, log: logPath, pid: child.pid });
}
