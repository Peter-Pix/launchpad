# Přehled architektury

## Vysokourovňový návrh

Launchpad je hybridní webová aplikace, která kombinuje Next.js frontend s Node.js backend API, aby poskytla desktopový zážitek pro správu lokálních vývojových aplikací.

```
┌─────────────────┐    HTTP/API    ┌─────────────────────┐
│   Uživatelské UI│ ◀─────────────▶ │   Next.js Server    │
│  (React Klient) │                │   (API Routy)       │
└─────────────────┘                └──────────┬──────────┘
                                               │
                                               ▼
                                       ┌─────────────────┐
                                       │  Souborový      │
                                       │  Systém &       │
                                       │  Správa Proc.   │
                                       └─────────────────┘
                                               │
                                               ▼
                                       ┌─────────────────┐
                                       │  Dceřiné        │
                                       │  Procesy        │
                                       │  (npm run dev)  │
                                       └─────────────────┘
```

## Technologický zásobník

### Frontend
- **Next.js 16** (App Router) s React 19
- **TypeScript** pro bezpečnost typů
- **Tailwind CSS** pro stylizaci
- **Server-Sent Events** pro streamování živých logů
- **localStorage** pro trvalý stav UI (cesta, jazyk)

### Backend
- **Next.js API Routy** (Node.js server)
- **TypeScript** pro bezpečnost typů
- **Child Process API** (`child_process.spawn`) pro správu aplikací
- **Sledování souborového systému** pro sledování logů (simulováno prostřednictvím dotazování)
- **Žádné externí závislosti** — veškerá logika běží v procesu Node.js

## Klíčové komponenty

### 1. Objevování aplikací (`lib/discover.ts`)
- Rekurzivně prohledává nakonfigurovaný adresář projektů
- Identifikuje adresáře obsahující `package.json` s `dev` skriptem
- Extrahuje metadata: název, framework, štítky, git info, časové značky
- Vrací uložený seznam objektů `AppInfo`
- Debounced pro zabránění příliš častému skenování souborového systému

### 2. Správa procesů (API routy v `app/api/apps/*`)
- **Spustit** (`/api/apps/start`): Vytvoří dětský proces spouštějící `npm run dev` v adresáři aplikace
  - Používá `child_process.spawn` s odpojenými stdio trubkami
  - Zachytává PID a spojuje ho s adresářem
  - Zahájí proces sledování logů
- **Zastavit** (`/api/apps/kill`): Ukončí skupinu procesů
  - Pošle SIGTERM, po časovém limitu přejde na SIGKILL
  - Vyčistí sledování procesu
- **Kontrola zdravosti**: Dotazuje se na naslouchání na portu nebo vlastní health endpoint
- **Podpora pracovních prostorů**: Skupiny aplikací pro kolektivní spuštění/zastavení

### 3. Správa logů (`app/api/apps/logs/*`)
- **Sledování logů**: Simulované `tail -f` prostřednictvím dotazování
  - Otevře logový soubor při spuštění procesu
  - Čte nové řádky v intervalech (250ms)
  - Odesílá prostřednictvím SSE připojeným klientům
- **Buffer logů**: V mezipaměti kruhový buffer (posledních 500 řádků)
- **Detekce úrovně**: Shoda vzorů pro error/warn/debug/info
- **SSE Streamování**: Server-Sent Events pro aktualizace v reálném čase
- **Stažení/Vymažení**: Operace File I/O pro trvalost logů

### 4. Nastavení a Trvalost (`lib/root.ts`, `app/api/settings/*`)
- **Rozlišení cesty**: Priorita: query param → localStorage → proměnná prostředí → výchozí
- **Validace**: Kontroluje, zda cesta existuje a je adresář
- **Uložiště**: `localStorage.launchpad.root` a `launchpad.lang`
- **Řetězec náhrad**: Poskytuje přechodné řešení pro lepší uživatelský zážitek

### 5. Mezinárodní podpora (`lib/i18n.ts`)
- **Slovník**: Angličtina a čeština
- **Detekce**: Čte z `localStorage` nebo výchozí angličtina
- **Pomocník**: Funkce `translate(lang, key, ...args)`
- **Komponenty**: Obálka `useCallback((k, ...a) => t(lang, k, ...a), [lang])`

### 6. Uživatelské rozhraní (`app/page.tsx`)
- **Hlavička**: Statistiky, ovládací prvky, přepínač jazyka, nastavení
- **Mřížka aplikací**: Responsivní karty zobrazující stav/akce aplikací
- **Omnibar**: Ctrl+K fuzzy vyhledávání podle názvu/cesty/štítků
- **Pracovní prostory**: Rychlé spouštění skupin aplikací
- **Zásuvka s logy**: Živý proud logů s filtrováním a ovládacími prvky
- **Zápatí**: Cesta pro objevování a užitečné tipy

## Tok dat

### Výpis aplikací
1. UI požaduje `/api/apps?root=<path>` při načtení a obnovení
2. API volá `discoverApps(root)` z `lib/discover.ts`
3. Funkce prohledává souborový systém a vrací `AppInfo[]`
4. UI vykresluje karty s metadaty a ukazateli stavu

### Spouštění aplikace
1. Uživatel klikne na tlačítko "Spustit" na kartě aplikace
2. UI POSTne na `/api/apps/start` s tělem `{ dir }`
3. API ověří adresář a vytvoří dětský proces:
   ```typescript
   const proc = spawn('npm', ['run', 'dev'], {
     cwd: dir,
     stdio: ['ignore', 'pipe', 'pipe']
   })
   ```
4. API zahájí sledování stdout/stderr do logového souboru
5. UI dotazuje se na aktualizaci stavu nebo naslouchá SSE pro logy

### Streamování logů
1. Uživatel klikne na tlačítko "Log" na kartě aplikace
2. UI otevře SSE připojení na `/api/apps/logs/stream?dir=<zakódováno>`
3. API sleduje soubor logů aplikace:
   - Otevře soubor v režimu sledování (posunutí na konec)
   - Čte nové řádky v intervalech
   - Detekuje úroveň logu pomocí shody vzorů
   - Odesílá událost SSE: `data: {timestamp, level, line}\n\n`
4. UI připojí řádky k zobrazení logů s barevným kódováním
5. Uživatel může pozastavit/obnovit proud na straně klienta

### Aktualizace nastavení
1. Uživatel zadá cestu do nastavení modalu a klikne na Uložit
2. UI POSTne na `/api/settings` s tělem `{ value }`
3. API ověří cestu pomocí `fs.stat()` a `fs.access()`
4. Při úspěchu: uloží do `localStorage.launchpad.root`
5. UI resetuje a spustí nové objevování aplikací s aktualizovanou cestou

## Bezpečnostní úvahy

### Validace cest
Všechny operace se souborovým systémem validují, že cesty:
- Jsou absolutní a normalizované
- Jsou uvnitř nakonfigurovaného kořene projektů nebo jeho podadresářů
- Jsou čitelné a přístupné adresáře
- Zabraňují útokům typu directory traversal přes kontroly `path.resolve()`

### Bezpečnost procesů
- Dětské procesy běží se stejnými oprávněními jako proces Launchpadu
- Žádná zvýšená oprávnění nebo únik z izolovaného prostředí
- stdio je omezen: stdin ignorován, stdout/stderr přečerpány do logů
- Skupiny procesů se používají pro čisté ukončení

### Síťová expozice
- Ve výchozím nastavení naslouchá pouze na localhostu (lze změnit přes proměnnou prostředí PORT)
- Žádná autentizace — předpokládá se důvěryhodné lokální prostředí
- Omezení CORS nejsou potřeba pro stejným původem použití
- SSE připojení jsou pouze stejného původu

## Charakteristiky výkonu

### Čas spuštění
- Počáteční objevení: O(n), kde n = počet prohledávaných adresářů
- Debounced na 300ms, aby se zabránilo příliš častému skenování při psaní
- Spuštění procesu: ~100-500ms v závislosti na času startu frameworku

### Využití paměti
- Metadata aplikací: ~1-2KB na aplikaci
- Buffer logů: 500 řádků × ~100 znaků = ~50KB na aktivní zobrazení logů
- Stav UI: Minimální stav komponent React
- Žádné velké mezipaměti nebo duplikace dat

### Škálovací limity
- Testováno s 100+ aplikacemi současně
- Výkon UI se graciézně degraduje s potenciálem pro virtuální zobrazení
- Šířka pásma streamování logů: ~1-10KB/s na aktivní proud
- Limity popisovačů souborů: Jeden sled logu na aktivní proud

## Body rozšiřitelnosti

### Přidání detekce nového frameworku
Upravte funkci `detectFramework()` v `lib/discover.ts`:
```typescript
if (deps.has('svelte') || devDeps.has('svelte')) return 'svelte';
```

### Přidání nových úrovní logu
Aktualizujte `detectLevel()` v `lib/log-level.ts`:
```typescript
const CUSTOM_PATTERNS = [/\\bcustom\\b/i];
```

### Přidání nových typů pracovních prostorů
Upravte zpracování pracovních prostorů v:
- `app/api/apps/workspace/route.ts`
- UI komponentách v `app/page.tsx`

### Změna výchozí složky projektů
Upravte `DEFAULT_ROOT` v `lib/root.ts`:
```typescript
const DEFAULT_ROOT = path.join(os.homedir(), 'projects');
```

### Přidání nových témat UI
Rozšiřte konfiguraci Tailwind v `tailwind.config.js`:
- Přidejte novou paletu barev
- Přidejte nový měřítko rozestupů
- Upravte plugin Typography

## Poznámky k nasazení

Ačkoli je navrženo pro lokální použití, Launchpad lze nasadit:
- **Docker**: Zkontejnerizovat s Node.js základním obrazem
- **Vercel/Netlify**: Jako statický web se serverless funkcemi (API routy)
- **Tradiční Server**: Node.js server s PM2 nebo systemd
- **Důležité**: Vázat se pouze na localhost nebo implementovat autentizaci pro vzdálený přístup

Aplikace je záměrně navržena tak, aby běžela na uživatelském stroji s přímým přístupem k souborovému systému pro optimální výkon a jednoduchost.
