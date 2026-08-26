import { NextResponse } from 'next/server';
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { resolveRoot } from '@/lib/root';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dir = searchParams.get('dir');
  if (!dir) return NextResponse.json({ error: 'Chybí dir' }, { status: 400 });

  const root = resolveRoot(req);
  const logPath = join(root, dir, '.launchpad.log');
  if (!existsSync(logPath)) {
    return NextResponse.json({ error: 'Žádný log' }, { status: 404 });
  }

  // Posledních ~50 řádků logu
  try {
    const content = readFileSync(logPath, 'utf-8');
    const lines = content.split('\n').filter(Boolean);
    const tail = lines.slice(-50);
    return NextResponse.json({ ok: true, dir, lines: tail, size: statSync(logPath).size });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
