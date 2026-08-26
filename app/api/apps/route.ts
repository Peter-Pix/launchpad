import { NextResponse } from 'next/server';
import { discoverApps } from '@/lib/discover';
import { resolveRoot } from '@/lib/root';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const root = resolveRoot(req);
  const apps = discoverApps(root);
  return NextResponse.json({ apps, count: apps.length, root, generatedAt: new Date().toISOString() });
}
