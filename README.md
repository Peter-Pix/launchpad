# 🚀 Launchpad

Centrální rozcestník pro všechny aplikace v `~/projects/`. Nové aplikace se přidají **automaticky** — stačí, aby měly `package.json` s dev scriptem.

## Jak to funguje

- **Auto-discovery**: server-side API (`/api/apps`) skenuje `~/projects/*` při každém requestu. Žádný manuální registr.
- **Status**: každá aplikace ukazuje, jestli běží, na jakém portu, framework a zdravotní stav.
- **Spuštění**: tlačítko "▶ Spustit" spustí `npm run dev` na pozadí a otevře aplikaci.
- **Konflikt portu**: pokud je port obsazený jinou aplikací, zobrazí se varování a start se zablokuje.
- **Omnibar**: `Ctrl + K` pro rychlé vyhledání a spuštění aplikace z klávesnice.
- **Workspaces**: aplikace se stejným `launchpad.workspaces` lze spustit najednou jedním kliknutím.
- **Live logy**: tlačítko "⎇ Log" otevře bottom drawer s live streamem logů, filtrováním a možností stažení/vymazání.

## Spuštění

### Z plochy (doporučeno)
Dvojklik na **`~/Desktop/Launchpad.app`** (nebo `Launchpad.command`) — spustí server a otevře prohlížeč.

### Ručně
```bash
cd ~/projects/launchpad
npm run dev   # port 3005
```
Otevři http://localhost:3005

## Konfigurace v package.json

```json
{
  "name": "my-app",
  "scripts": { "dev": "next dev -p 8888" },
  "launchpad": {
    "icon": "🎵",
    "port": 8888,
    "tags": ["music", "production"],
    "workspaces": ["AI Suite"],
    "healthPath": "/api/health",
    "healthExpected": [200, 401]
  }
}
```

## Bezpečnost

**Launchpad je navržený výhradně pro localhost použití.** Všechny akce, které mění stav (spuštění, zastavení, vymazání logů, spuštění workspace), jsou chráněné proti vzdálenému přístupu — API je přístupné pouze z `127.0.0.1` / `::1` / `localhost`.

Nespouštěj Launchpad na veřejně dostupném serveru. Poskytuje přímý přístup k lokálním projektům a mohl by být zneužit ke spuštění libovolného kódu ve tvém `~/projects` adresáři.

## Struktura

```
app/
  page.tsx              # UI grid aplikací
  api/apps/route.ts     # GET — seznam aplikací
  api/apps/start/route.ts    # POST — spustí aplikaci
  api/apps/kill/route.ts     # POST — zastaví aplikaci
  api/apps/workspace/route.ts    # POST — spustí workspace
  api/apps/logs/stream/route.ts  # GET SSE — live log stream
  api/apps/logs/clear/route.ts   # POST — vymazat log
  api/apps/logs/download/route.ts # GET — stáhnout log
lib/
  discover.ts           # auto-discovery + health-check
  guard.ts              # localhost ochrana
  log-level.ts          # detekce úrovně log řádku
```

## Poznámky

- Aplikace sdílející port 3000 (Next.js default) se navzájem blokují — doporučuji dát každé unikátní port (`-p 8888` apod.).
- Logy spuštěných aplikací: `.launchpad.log` v adresáři aplikace.
