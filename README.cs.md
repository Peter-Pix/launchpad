# 🚀 Launchpad

Centrální rozcestník pro všechny vaše lokální vývojové aplikace. Automaticky detekuje projekty s `package.json` dev scriptem — žádná ruční konfigurace, žádné registry. Podívejte se, co běží, spusťte/zastavte aplikace, streamujte živé logy a spouštějte celé pracovní prostory jedním klikem.

Výhradně pro localhost. Běží výhradně na vašem stroji.

## 🚀 Rychlý start

```bash
# Naklonujte repo
git clone https://github.com/Peter-Pix/launchpad.git
cd launchpad

# Nainstalujte závislosti
npm install

# Spusťte
npm run dev
```

Otevřete [http://localhost:3005](http://localhost:3005) — Launchpad automaticky naskenuje vaši `~/projects` složku (nebo ji můžete změnit přes ⚙️ nastavení).

## 🔑 Funkce

### Auto-discovery
- Prochází zvolený adresář (default `~/projects`)
- Najde každý projekt s `package.json` obsahující `dev` script
- Automaticky detekuje nové projekty — žádná ruční registrace

### Kontrola stavu a správa
- Zobrazí stav aplikace: běží, zastaveno, konflikt portu
- Jedním klikem spusťte (`npm run dev`) nebo zastavte aplikaci
- Zobrazuje využití portů a upozorní na konflikty

### Živé logy
- Streamujte stdout/stderr v reálném čase
- Přehled barevné logy podle úrovni (info, warn, error, debug)
- Možnost pauzy, stažení, vymazání logů
- Zdrojové mapování (pokud je dostupné)

### Workspaces
- Definujte skupiny aplikací pro spouštění společně
- Spusťte/zastavte celý pracovní prostor jedním klikem
- Uložte vlastní pracovní prostory pro různé workflow

### Konfigurovatelná cesta k projektům
- Klikněte na ⚙️ ozubené kolečko v pravém horním rohu
- Nastavte vlastní cestu k adresáři s projekty (např. `/mnt/code`, `/workspaces`)
- Uloženo do `localStorage` — pamatuje se mezi sezeními
- Fallback: proměnná prostředí `LAUNCHPAD_ROOT` → `~/projects`

### Vyhledávání a filtry (Ctrl+K)
- Okamžité filtrování podle:
  - Frameworku (Next.js, Vite, Node, jiné)
  - Stavu (běží, zastaveno, offline)
  - Tagy (přidejte `tags` do `package.json`)
  - Textového vyhledávání (název, adresář, tagy)
- Řazení: A–Z, poslední commit, datum vytvoření

### Klávesové zkratky
- `Ctrl+K` — zaměřit vyhledávání (omnibar)
- `Esc` — zavřít omnibar/nastavení/logy
- `Enter` v omnibaru — spustit vybranou aplikaci

### Nastavení (⚙️)
- **Cesta k projektům** — kde Launchpad hledá aplikace
- **Auto-otevřít** — po spuštění automaticky otevřít aplikaci v prohlížeči
- **Jazyk UI** — přepínač Čeština/English (vedle ozubeného kolečka)

## 🛠️ Vývoj a přispívání

### Architektura
- **Next.js 16** (App Router) — React 19, TypeScript
- **Backend API routes** — `/api/apps/*` pro správu aplikací
- **Server-Sent Events** — živé streamování logů
- **Lokální úložiště** — `localStorage` pro nastavení a jazyk
- **Žádná externí závislosti na databázi** — vše běží v procesech Node.js

### Struktura kódu
```
launchpad/
├── app/                  # Next.js app router
│   ├── api/              # API routes (apps, settings, logs)
│   ├── layout.tsx        # kořenový layout
│   └── page.tsx          # hlavní UI
├── lib/                  # sdílené utility
│   ├── discover.ts       # auto-discovery aplikací
│   ├── i18n.ts           # mezinárodní podpora (EN/CZ)
│   ├── log-level.ts      # detekce úrovně logu
│   └── root.ts           # konfigurace kořenové cesty
├── public/               # statické soubory
└── styles/               # globální CSS
```

### API reference
Všechny API endpointy jsou relativní k základné URL a akceptují volitelný query parametr `?root=` pro přepsání výchozí cesty k projektům.

#### GET `/api/apps`
Vrátí seznam všech detekovaných aplikací s jejich metadatami.

#### GET `/api/apps/logs/stream?dir=<urlencoded>`
Streamuje živé logy pro danou aplikaci přes Server-Sent Events.

#### POST `/api/apps/start`
Spustí aplikaci (očekává `{ dir: string }` v těle).

#### POST `/api/apps/kill`
Zastaví běžící aplikaci.

#### POST `/api/apps/logs/clear`
Vymaže logy pro danou aplikaci.

#### GET `/api/apps/logs/download?dir=<urlencoded>`
Stáhne logy jako plain text soubor.

#### GET `/api/settings`
Vrátí aktuálně nakonfigurovanou cestu k projektům.

#### POST `/api/settings`
Validuje a uloží novou cestu k projektům (očekává `{ value: string }`).

### Přispívání
1. Forkněte repozitář
2. Vytvořte větev: `git checkout -b feature/název-feature`
3. Proveďte změny
4. Dodržte formát commitů: `typ: popis` (feat, fix, docs, refactor, test, chore)
5. Otestujte lokálně: `npm run dev`
6. Odeslat pull request

### Vývojové prostředí
- **Node.js ≥20** (doporučeno LTS)
- **npm ≥10**
- Žádné další závislosti kromě těch v `package.json`

### Testování
- Spusťte vývojový server: `npm run dev`
- Otevřete [http://localhost:3005](http://localhost:3005)
- Testujte funkce: přidání projektu, spuštění/zastavení, logy, nastavení

## 📝 Pravidla a konvence

### Commit zprávy
Používejte konvenční commit zprávy:
- `feat:` — nová funkce
- `fix:` — oprava chyby
- `docs:` — dokumentace
- `refactor:` — refaktorování bez změn funkcionality
- `test:` — testy
- `chore:` — údržba, build, závislosti

### Struktura projektu
- Pracovní adresář pro aplikace je konfigurovatelný (viz nastavení)
- Žádné velké binární soubory v repozitáři
- Všechny konfigurace by měly být v kódu nebo proměnných prostředí

### Bezpečnost
- Launchpad je určen **pouze pro lokální použití**
- Nenainstalovávejte jej na veřejně přístupné servery
- Neukládejte citlivé informace do názvů projektů nebo cest

## 📄 Licence

MIT License — viz soubor `LICENSE` pro detaily.

© 2026 Peter Piskáček
