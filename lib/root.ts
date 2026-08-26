import { join } from 'path';
import { existsSync, statSync } from 'fs';

/**
 * Výchozí kořen projektů.
 * Priorita: env LAUNCHPAD_ROOT → ~/projects
 */
export const DEFAULT_ROOT =
  process.env.LAUNCHPAD_ROOT || join(process.env.HOME || '', 'projects');

/**
 * Rozliší kořen projektů pro daný request.
 * Klient může poslat vlastní cestu přes query parametr `root`
 * (nastavenou v UI přes ozubené kolečko). Jinak se použije DEFAULT_ROOT.
 */
export function resolveRoot(req?: Request): string {
  if (req) {
    try {
      const root = new URL(req.url).searchParams.get('root');
      if (root && root.trim()) return root.trim();
    } catch {
      // nevalidní URL — spadni na default
    }
  }
  return DEFAULT_ROOT;
}

/** Ověří, že cesta existuje a je to adresář. */
export function isValidRoot(root: string): boolean {
  try {
    return existsSync(root) && statSync(root).isDirectory();
  } catch {
    return false;
  }
}
