import { join } from 'path';
import { existsSync, createReadStream, statSync } from 'fs';
import { spawn } from 'child_process';
import { assertLocalhost } from '@/lib/guard';
import { resolveRoot } from '@/lib/root';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const guard = assertLocalhost(req);
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const dir = searchParams.get('dir');
  if (!dir) return new Response('Chybí dir\n', { status: 400 });

  const root = resolveRoot(req);
  const logPath = join(root, dir, '.launchpad.log');
  if (!existsSync(logPath)) {
    return new Response('Log neexistuje\n', { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Pošle posledních 50 řádků
      let sentInitial = false;
      try {
        const size = statSync(logPath).size;
        const chunkSize = Math.min(size, 8 * 1024);
        let chunk = '';
        const fd = createReadStream(logPath, { start: Math.max(0, size - chunkSize), end: size - 1, encoding: 'utf-8' });
        fd.on('data', (d) => (chunk += d.toString()));
        fd.on('end', () => {
          const lines = chunk.split('\n').filter(Boolean);
          const tail = lines.slice(-50);
          for (const line of tail) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'line', line })}\n\n`));
          }
          sentInitial = true;
        });
      } catch {
        sentInitial = true;
      }

      // tail -f přes spawn (spolehlivější než fs.watch)
      const tail = spawn('tail', ['-f', '-n', '0', logPath], {
        stdio: ['ignore', 'pipe', 'ignore'],
      });

      tail.stdout.on('data', (data: Buffer) => {
        const lines = data.toString('utf-8').split('\n').filter(Boolean);
        for (const line of lines) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'line', line })}\n\n`));
        }
      });

      tail.on('error', () => controller.close());
      tail.on('close', () => controller.close());

      req.signal.addEventListener('abort', () => {
        try { tail.kill(); } catch {}
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
