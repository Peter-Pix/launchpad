import { join } from 'path';
import { existsSync, createReadStream } from 'fs';
import { assertLocalhost } from '@/lib/guard';

export const dynamic = 'force-dynamic';

const PROJECTS_ROOT = process.env.LAUNCHPAD_ROOT || join(process.env.HOME || '', 'projects');

export async function GET(req: Request) {
  const guard = assertLocalhost(req);
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const dir = searchParams.get('dir');
  if (!dir) return new Response('Chybí dir\n', { status: 400 });

  const logPath = join(PROJECTS_ROOT, dir, '.launchpad.log');
  if (!existsSync(logPath)) {
    return new Response('Log neexistuje\n', { status: 404 });
  }

  const stream = createReadStream(logPath);
  return new Response(stream as any, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${dir}-launchpad.log"`,
    },
  });
}
