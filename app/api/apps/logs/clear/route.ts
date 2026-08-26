import { NextResponse } from 'next/server';
import { truncateSync, existsSync } from 'fs';
import { join } from 'path';
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
  const logPath = join(root, dir, '.launchpad.log');
  if (!existsSync(logPath)) {
    return NextResponse.json({ error: 'Log neexistuje' }, { status: 404 });
  }

  try {
    truncateSync(logPath, 0);
    return NextResponse.json({ ok: true, cleared: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
