import { NextResponse } from 'next/server';
import { join } from 'path';
import { discoverApps } from '@/lib/discover';
import { assertLocalhost } from '@/lib/guard';
import { resolveRoot } from '@/lib/root';
import { killAppProcesses, validateAppDir } from '@/lib/process';

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

  const validation = validateAppDir(appPath);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const apps = discoverApps(root);
  const app = apps.find((a) => a.dir === dir);

  // Vždy zkusíme zabít procesy a vyčistit stale port,
  // i když app.running je false (mrtvý proces mohl zanechat port)
  const killed = killAppProcesses(appPath, app?.port ?? null);

  if (!app?.running && killed === 0) {
    return NextResponse.json({ ok: true, alreadyStopped: true });
  }

  return NextResponse.json({ ok: true, killed: true, dir, pids: killed });
}
