import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
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
  if (!app?.running) {
    return NextResponse.json({ ok: true, alreadyStopped: true });
  }

  let killedPids = 0;
  try {
    const pids = execSync(
      `ps aux | grep -iE "next|vite|node|tsx|npm" | grep -v grep | grep -F "${appPath}" | awk '{print $2}'`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim().split('\n').filter(Boolean);

    if (pids.length > 0) {
      killedPids = pids.length;
      try { execSync(`kill ${pids.join(' ')} 2>/dev/null || true`, { stdio: 'ignore' }); } catch {}
      try { execSync(`sleep 1; kill -9 ${pids.join(' ')} 2>/dev/null || true`, { stdio: 'ignore' }); } catch {}
    }

    if (app.port) {
      try {
        execSync(`lsof -tiTCP:${app.port} -sTCP:LISTEN 2>/dev/null | xargs kill 2>/dev/null || true`, { stdio: 'ignore' });
      } catch {}
    }

    return NextResponse.json({ ok: true, killed: true, dir, pids: killedPids });
  } catch (e: any) {
    return NextResponse.json({ error: `Chyba při zastavení: ${e.message}` }, { status: 500 });
  }
}
