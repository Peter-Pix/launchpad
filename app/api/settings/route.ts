import { NextResponse } from 'next/server';
import { resolveRoot, isValidRoot, DEFAULT_ROOT } from '@/lib/root';
import { assertLocalhost } from '@/lib/guard';

export const dynamic = 'force-dynamic';

/** GET — vrátí aktuální kořen projektů (default nebo z query). */
export async function GET(req: Request) {
  const root = resolveRoot(req);
  return NextResponse.json({ root, valid: isValidRoot(root), default: DEFAULT_ROOT });
}

/** POST — ověří, že zadaná cesta je platný adresář. */
export async function POST(req: Request) {
  const guard = assertLocalhost(req);
  if (guard) return guard;

  let body: any = {};
  try { body = await req.json(); } catch {}

  const root = typeof body?.root === 'string' ? body.root.trim() : '';
  if (!root) {
    return NextResponse.json({ ok: false, error: 'Prázdná cesta' }, { status: 400 });
  }

  if (!isValidRoot(root)) {
    return NextResponse.json(
      { ok: false, error: 'Cesta neexistuje nebo není adresář' },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, root });
}
