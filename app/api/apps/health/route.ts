import { NextResponse } from 'next/server';
import { checkAppHealth, getHealthPaths } from '@/lib/discover';
import { assertLocalhost } from '@/lib/guard';
import { resolveRoot } from '@/lib/root';

export const dynamic = 'force-dynamic';

function detectFramework(query: string | null): 'next' | 'vite' | 'node' | 'other' {
  if (query === 'next') return 'next';
  if (query === 'vite') return 'vite';
  if (query === 'node') return 'node';
  return 'other';
}

function normalizeExpected(expected: unknown): number[] {
  if (!expected) return [];
  if (Array.isArray(expected)) return expected.filter((x) => typeof x === 'number') as number[];
  if (typeof expected === 'number') return [expected];
  return [];
}

export async function GET(req: Request) {
  const guard = assertLocalhost(req);
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const dir = searchParams.get('dir');
  const portParam = searchParams.get('port');
  const frameworkParam = searchParams.get('framework');
  const customPath = searchParams.get('healthPath');
  const expectedRaw = searchParams.get('healthExpected');

  if (!dir) return NextResponse.json({ error: 'Chybí dir' }, { status: 400 });

  const port = portParam ? parseInt(portParam, 10) : null;
  if (!port || isNaN(port)) {
    return NextResponse.json({ error: 'Chybí platný port' }, { status: 400 });
  }

  // Ochrana proti sebe-rekurzi: nehealth-checkujeme Launchpad sám na sobě
  const launchpadPort = parseInt(process.env.LAUNCHPAD_PORT || '3005', 10);
  if (port === launchpadPort && dir === 'launchpad') {
    return NextResponse.json({ ok: true, dir, port, healthy: true, skipped: true, checks: [] });
  }

  const framework = detectFramework(frameworkParam);
  let healthExpected: number[] = [];
  if (expectedRaw) {
    try { healthExpected = normalizeExpected(JSON.parse(expectedRaw)); } catch {}
  }

  const { healthy, checks } = await checkAppHealth(port, framework, customPath, healthExpected);

  return NextResponse.json({ ok: true, dir, port, healthy, checks });
}
