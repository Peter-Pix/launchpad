# Průvodce přispěvatele

Děkujeme, že uvažujete o přispění do Launchpadu! Tento dokument popisuje proces a standardy pro přispívání do projektu.

## Jak přispět

1. **Forkněte repozitář** na GitHubu
2. **Naklonujte svůj fork** lokálně:
   ```bash
   git clone https://github.com/vaše-jměn/launchpad.git
   cd launchpad
   ```
3. **Vytvořte větev** pro svou funkci nebo opravu:
   ```bash
   git checkout -b feature/název-vaší-funkce
   # nebo
   git checkout -b fix/oprava-vaší-chyby
   ```
4. **Proveďte své změny** podle níže uvedených kodérských standardů
5. **Otestujte své změny** lokálně:
   ```bash
   npm run dev
   ```
6. **Zavazujte své změny** pomocí konvenčních závazků (viz níže)
7. **Pushněte do svého forku** a otevřete Pull Request

## Nastavení vývoje

### Požadavky
- Node.js ≥20 (doporučeno LTS)
- npm ≥10
- Git

### Instalace
```bash
# Naklonujte a nainstalujte závislosti
git clone https://github.com/vaše-jměn/launchpad.git
cd launchpad
npm install

# Spusťte vývojový server
npm run dev
```

Aplikace bude dostupná na [http://localhost:3005](http://localhost:3005).

## Kodérské standardy

### TypeScript
- Používáme přísný TypeScript (`tsconfig.json` má `"strict": true`)
- Vždy definujte typy pro parametry funkcí a návratové hodnoty
- Používejte rozhraní pro tvary objektů, typy pro sjednocené/primitivní typy
- Preferujte `const` nad `let`, `let` nad `var`

### React & Next.js
- Používejte funkční komponenty s háčky
- Dodržujte konvence Next.js 16 App Router
- Udržujte komponenty malé a zaměřené
- Používejte utility třídy Tailwind CSS pro stylizaci (viz `app/globals.css`)
- Klientské komponenty musí být označeny direktivou `"use client"`

### Organizace souborů
```
launchpad/
├── app/                 # Next.js app router
│   ├── api/             # obslužné rutiny API rout
│   ├── layout.tsx       # kořenový layout
│   └── page.tsx         # hlavní UI
├── lib/                 # sdílené utility
│   ├── discover.ts      # automatické objevování aplikací
│   ├── i18n.ts          # mezinárodní podpora (EN/CZ)
│   ├── log-level.ts     # detekce úrovně logu
│   └── root.ts          # konfigurace kořenové cesty
├── public/              # statické prostředky
└── styles/              # globální CSS
```

### Mezinárodní podpora
- Všechna uživatelská rozhraní procházejí pomocníkem `t()` z `@/lib/i18n`
- Nikdy nevkládejte přímo texty uživatelského rozhraní do JSX
- Přidejte nové řetězce do slovníků `en` i `cs` v `i18n.ts`
- Používejte `useCallback` obálku pro funkci `t` v komponentách

### Stylizace
- Používá Tailwind CSS prostřednictvím PostCSS
- Přístup utility-first: upřednostňujte utility třídy před vlastním CSS
- Vlastní CSS patří pouze do `app/globals.css` v naprosto nutných případech
- Responsivní design: používejte odpovědné prefixy Tailwindu (sm:, md:, lg:, xl:)

### API routy
- Všechny API routy jsou v `app/api/`
- Používejte Route Handlers Next.js 16 (exportujte funkce GET, POST, atd.)
- Validujte všechny vstupy (zejména cest k souborům)
- Vracejte příslušné HTTP status kódy
- Graceful zpracování chyb pomocí try/catch

### Stav aplikace
- Stav Reactu (`useState`, `useReducer`) pro stav UI
- `localStorage` pro trvalá nastavení uživatele (cesta, jazyk)
- Vyhněte se globálnímu stavu, pokud není absolutně nutný
- Odvozujte stav z props, kdy je to možné

### Výkon
- Minimalizujte opětovné vykreslování komponent
- Používejte `React.memo` pro drahé komponenty, když je to vhodné
- Debounce nákladné operace (vyhledávání, filtrování)
- Virtualizujte dlouhé seznamy, pokud je to potřeba (zatím není implementováno)

## Konvenční závazky

Držíme se specifikace [Conventional Commits](https://www.conventionalcommits.org/):

### Formát
```
<typ>[volitelný obor]: <popis>

[volitelné tělo]

[volitelné patička(-e)]
```

### Typy
- `feat:` — Nová funkce
- `fix:` — Oprava chyby
- `docs:` — Pouze změny dokumentace
- `style:` — Změny, které neovlivňují význam kódu (bílé znaky, formátování, chybějící středník, atd.)
- `refactor:` — Změna kódu, která ani neopravuje chybu ani nepřidává funkci
- `perf:` — Změna kódu, která zlepšuje výkon
- `test:` — Přidání chybějících testů nebo oprava existujících testů
- `chore:` — Změny v procesu sestavování nebo pomocných nástrojích a knihovnách

### Příklady
- `feat: přidat přepínač jazyka do hlavičky`
- `fix: oprava logiky detekce konfliktu portů`
- `docs: aktualizace uživatelské příručky o vysvětlení nastavení`
- `refactor: extrahuj funkci discoverApps do lib/discover.ts`
- `perf: debounce vstupu vyhledávání pro snížení volání API`
- `test: přidejte jednotkové testy pro validaci kořenové cesty`

## Proces Pull Requestu

1. **Aktualizujte README.md** pokud je potřeba s změnami funkčnosti
2. **Ujistěte se, že váš kód projde kontrolou TypeScriptu**: `npm run build`
3. **Otestujte své změny** manuálně v režimu vývoje
4. **Aktualizujte dokumentaci** v `/docs/` pokud vaše změny ovlivňují použití
5. **Udržujte změny soustředěné** — jeden PR by měl řešit jeden problém/funkci
6. **Napište jasný popis PR** vysvětlující co a proč
7. **Propojte s jakýmikoli souvisejícími problémy** pomocí `fixes #issue` nebo `closes #issue`

## Recenze kódu

- Všechny PR vyžadují alespoň jedno schválení od správce
- Recenze se zaměřuje na:
  - Správnost a úplnost
  - Dodržování kodérských standardů
  - Výkonové důsledky
  - Bezpečnostní úvahy
  - Pokrytí testy (pokud je relevantní)
  - Kvalitu dokumentace

## Hlášení chyb

Při hlášení chyb prosím uveďte:
- **Kroky k reprodukci**
- **Očekávané chování**
- **Skutečné chování**
- **Snímky obrazovky** (pokud jsou relevantní)
- **Verzi Launchpadu** (z patičky nebo `package.json`)
- **Prostředí** (OS, verze Node.js, prohlížeč)

## Jak získat pomoc

Pokud jste zaseknuti nebo máte otázky:
1. Zkontrolujte existující dokumentaci v `/docs/`
2. Prohlédněte si existující issues a PRs
3. Zeptejte se v záložce GitHub Discussions
4. Jako poslední možnost označte správce v issue

Děkujeme, že přispíváte do Launchpadu!
