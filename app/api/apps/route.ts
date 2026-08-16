import { NextResponse } from 'next/server';
import { discoverApps } from '@/lib/discover';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apps = discoverApps();
  return NextResponse.json({ apps, count: apps.length, generatedAt: new Date().toISOString() });
}
