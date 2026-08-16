# 🚀 Launchpad

Centrální rozcestník pro všechny aplikace v `~/projects/`. Nové aplikace se přidají **automaticky** — stačí, aby měly `package.json` s dev scriptem.

## Jak to funguje

- **Auto-discovery**: server-side API (`/api/apps`) skenuje `~/projects/*` při každém requestu. Žádný manuální registr.
- **Status**: každá aplikace ukazuje, jestli běží (detekce podle procesu), na jakém portu, a framework.
- **Spuštění**: tlačítko "▶ Spustit" spustí `npm run dev` na pozadí a otevře aplikaci.
- **Konflikt portu**: pokud je port obsazený jinou aplikací, zobrazí se varování a start se zablokuje.

## Spuštění

### Z plochy (doporučeno)
Dvojklik na **`~/Desktop/Launchpad.app`** (nebo `Launchpad.command`) — spustí server a otevře prohlížeč.

### Ručně
```bash
cd ~/projects/launchpad
npm run dev   # port 3005
```
Otevři http://localhost:3005

## Konfigurace

- **Port**: `3005` (nastaveno v `package.json` dev scriptu)
- **Root adresář**: `~/projects` (lze změnit env proměnnou `LAUNCHPAD_ROOT`)

## Struktura

```
app/
  page.tsx              # UI grid aplikací
  api/apps/route.ts     # GET — seznam aplikací
  api/apps/start/route.ts  # POST — spustí aplikaci
lib/
  discover.ts           # auto-discovery logika
```

## Poznámky

- Aplikace sdílející port 3000 (Next.js default) se navzájem blokují — doporučuji dát každé unikátní port (`-p 8888` apod.).
- Logy spuštěných aplikací: `~/.launchpad.log` v adresáři aplikace.
