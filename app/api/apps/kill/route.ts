import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { discoverApps } from '@/lib/discover';

export const dynamic = 'force-dynamic';

const PROJECTS_ROOT = process.env.LAUNCHPAD_ROOT || join(process.env.HOME || '', 'projects');

export async function POST(req: Request) {
  let body: any = {};
  try { body = await req.json(); } catch {}

  const dir = body?.dir;
  if (!dir) return NextResponse.json({ error: 'Chybí dir' }, { status: 400 });

  const appPath = join(PROJECTS_ROOT, dir);
  if (!existsSync(join(appPath, 'package.json'))) {
    return NextResponse.json({ error: `Nenalezen package.json v ${dir}` }, { status: 404 });
  }

  // Zjistit, jestli běží
  const apps = discoverApps();
  const app = apps.find((a) => a.dir === dir);
  if (!app?.running) {
    return NextResponse.json({ ok: true, alreadyStopped: true });
  }

  let killedPids = 0;
  try {
    // Najít PIDy procesů patřících aplikaci
    const pids = execSync(
      `ps aux | grep -iE "next|vite|node|tsx|npm" | grep -v grep | grep -F "${appPath}" | awk '{print $2}'`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim().split('\n').filter(Boolean);

    if (pids.length > 0) {
      killedPids = pids.length;
      // SIGTERM, pak SIGKILL — tolerovat, že procesy už mohou být mrtvé
      try { execSync(`kill ${pids.join(' ')} 2>/dev/null || true`, { stdio: 'ignore' }); } catch {}
      try { execSync(`sleep 1; kill -9 ${pids.join(' ')} 2>/dev/null || true`, { stdio: 'ignore' }); } catch {}
    }

    // Fallback: zabít podle portu
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
