# Launchpad Cheat Sheet

## Klávesové zkratky
- `Ctrl+K` — Zaostřit vyhledávání (omnibar)
- `Esc` — Zavřít vyhledávání/nastavení/logy
- `Enter` (v omnibaru) — Spustit vybranou aplikaci
- `↑`/`↓` — Navigovat v omnibaru/výsledcích vyhledávání
- `←`/`→` — Přepínat mezi záložkami v nastavení (pokud jsou rozšířené)

## URL vzory
- Základní: `http://localhost:3005`
- Seznam aplikací: `/api/apps?root=<cesta>`
- Spusť aplikaci: `POST /api/apps/start` + `{ "dir": "/cesta/k/aplikaci" }`
- Zastav aplikaci: `POST /api/apps/kill` + `{ "dir": "/cesta/k/aplikaci" }`
- Proud logů: `GET /api/apps/logs/stream?dir=<zakódováno>`
- Nastavení: `GET /api/settings` nebo `POST /api/settings` + `{ "value": "/cesta" }`

## Běžné odpovědi API

### Objekt aplikace
```json
{
  "id": "hash",
  "name": "název-aplikace",
  "dir": "/plná/cesta/k/aplikaci",
  "framework": "next|vite|node|other",
  "štítky": ["web", "frontend"],
  "běží": true,
  "zdravá": true,
  "port": 3000,
  "konfliktPortu": false,
  "vytvořenoV": 1724659200,
  "posledníCommit": 1724659200,
  "url": "http://localhost:3000"
}
```

### Záznam logu (SSE)
```
data: {"timestamp":1724659200,"level":"info","line":"ready - started server on http://localhost:3000"}

```

### Nastavení
```json
{ "root": "/home/user/projects" }
```

## Proměnné prostředí
- `LAUNCHPAD_ROOT` — Přepiš výchozí složku projektů (`~/projects`)
- `PORT` — Změň port Launchpadu (výchozí 3005)

## Místní úložiště
- `launchpad.root` — Vlastní cesta k projektům
- `launchpad.lang` — Jazyk UI (`en` nebo `cs`)

## Struktura souborů zvýrazněná
- `app/page.tsx` — Hlavní UI
- `app/api/apps/*` — Správa aplikací
- `app/api/apps/logs/*` — Správa logů
- `app/api/settings/route.ts` — Koncový bod nastavení
- `lib/discover.ts` — Logika automatického objevování aplikací
- `lib/i18n.ts` — Mezinárodní podpora (EN/CZ)
- `lib/root.ts` — Rozlišení a validace kořenové cesty
- `lib/log-level.ts` — Detekce úrovně logu

## Rychlé příkazy
```bash
# Vývoj
npm run dev          # Spusť vývojový server
npm run build        # Vytvoř produkční sestavení
npm start            # Spusť produkční server
npx tsc --noEmit     # Kontrola TypeScriptu
npm run type-check   # Alias pro výše uvedené

# Ladění
curl http://localhost:3005/api/apps                  # Seznam aplikací
curl -X POST http://localhost:3005/api/apps/start -H "Content-Type: application/json" -d '{"dir":"/cesta/k/aplikaci"}'  # Spusť aplikaci
```

## Rychlé opravy při řešení problémů

### Nebyly nalezeny žádné aplikace
1. Zkontrolujte nastavení (⚙️) pro správnou cestu
2. Ověřte, že složky mají `package.json` s `dev` scriptem
3. Zkuste tlačítko obnovení (↻)
4. Zkontrolujte konzoli pro chyby oprávnění

### Konflikty portů
- Změňte port aplikace nebo zastavte konfliktní proces
- Launchpad zobrazuje upozornění ⚠️ na postižených kartách

### Logy se neaktualizují
- Zkontrolujte, zda není pozastaveno (tlačítko ⏸ v zásuvce s logy)
- Zavřete a znovu otevřete zásuvku s logy
- Ověřte, že proces aplikace stále běží

### Nastavení se neukládá
- Ověřte, že cesta existuje a je čitelná
- Zkontrolujte konzoli prohlížeče pro chyby úložiště
- Zkuste vymazat data webu a znovu načíst

## Detekce frameworku
Launchpad automaticky detekuje framework ze závislostí:
- `next` → Next.js
- `vite` → Vite
- `node` → Node.js (bez konkrétního frameworku)
- `other` → Vše ostatní

## Úrovně logu
- `info` — Obecné informace (šedá)
- `warn` — Upozornění (oranžová)
- `error` — Chyby (červená)
- `debug` — Ladicí informace (modrá)

## Metadat zobrazená na kartách aplikací
- **Název**: Z `package.json` nebo názvu adresáře
- **Framework**: Automaticky detekovaný odznak
- **Štítky**: Z `package.launchpad.tags` nebo `keywords`
- **Stav**: ● běží zdravě, ● nezdravá, ○ zastaveno
- **Poslední commit**: Relativní čas (pokud je git repozitář)
- **Vytvořeno**: Relativní čas (systémový čas vytvoření souboru)
- **URL**: Detekována nebo z `package.launchpad.url`
- **Port**: Detekovaný poslouchávaný port
- **Konflikt**: ⚠️ pokud je port obsazený

## Formát pracovních prostorů
Pracovní prostory jsou definovány v kódu (ještě nekonfigurovatelné uživateli):
```typescript
{
  název: "název-pracovního-prostoru",
  aplikace: ["id-aplikace-1", "id-aplikace-2"] // Pole ID aplikací
}
```
Definováno v poli `workspaces` v `app/page.tsx`.

## Informace o verzi
- Zkontrolujte `package.json` pro verzi
- Zápatí ukazuje časové razítko sestavení ve vývojovém režimu
- Verze API je svázána s verzí aplikace

## Omezení a constrainty
- Maximální velikost bufferu logů: 500 řádků na aplikaci
- Výchozí hloubka skenování: Neomezená (rekurzivní)
- Doporučené maximum současných aplikací: 50+ (o testováno na 100+)
- Limit popisovačů souborů: Jeden sled logu na aktivní proud
- Validace vstupu: Všechny cesty kontrolovány na útoky typu traversal
