import { NextResponse } from 'next/server';

function isLocalAddress(host: string | null, remoteAddr: string | null): boolean {
  // Trust loopback only
  const safeHosts = ['localhost', '127.0.0.1', '[::1]', '::1'];
  if (host) {
    const h = host.split(':')[0].toLowerCase();
    if (safeHosts.includes(h)) return true;
  }
  if (remoteAddr) {
    const a = remoteAddr;
    if (a === '127.0.0.1' || a === '::1' || a.startsWith('::ffff:127.0.0.1')) return true;
  }
  return false;
}

export function assertLocalhost(req: Request) {
  const host = req.headers.get('host');
  // @ts-ignore — Next.js Request extends standard Request; socket is available on Node internals
  const remoteAddr = req.socket?.remoteAddress ?? null;
  if (!isLocalAddress(host, remoteAddr)) {
    return NextResponse.json(
      { error: 'Pouze localhost přístup' },
      { status: 403 }
    );
  }
  return null;
}
