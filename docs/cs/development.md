# Postup vývoje

## Nastavení vývojového prostředí

### Požadavky
- Node.js ≥20 (doporučeno LTS verze)
- npm ≥10
- Git

### Instalace
```bash
# Forkněte a naklonujte repozitář
git clone https://github.com/vaše-jměn/launchpad.git
cd launchpad

# Nainstalujte závislosti
npm install

# Ověřte instalaci
npx tsc --noEmit  # Nemělo by ukázat žádné chyby
```

### Spuštění vývojového serveru
```bash
npm run dev
```

Aplikace bude dostupná na [http://localhost:3005](http://localhost:3005).

## Struktura projektu

```
launchpad/
├── app/                 # Next.js app router (React 19, TypeScript)
│   ├── api/             # API route handlers (Node.js backend)
│   │   ├── apps/        # Správa aplikací endpoints
│   │   │   ├── start/route.ts     # POST - spusť aplikaci
│   │   │   ├── kill/route.ts      # POST - zastav aplikaci
│   │   │   ├── logs/              # Správa logů endpoints
│   │   │   │   ├── route.ts       # GET - získej nedávné logy
│   │   │   │   ├── stream/route.ts # GET - SSE proud logů
│   │   │   │   ├── clear/route.ts  # POST - vymaž logy
│   │   │   │   └── download/route.ts # GET - stáhni logy
│   │   │   ├── workspace/         # Správa pracovních prostorů
│   │   │   │   └── route.ts       # GET/POST - operace s pracovními prostory
│   │   │   ├── health/route.ts    # GET - kontrola zdravosti
│   │   │   └── settings/route.ts  # GET/POST - správa nastavení
│   │   └── apps/route.ts          # GET - seznam všech aplikací
│   ├── layout.tsx       # Kořenový layout (HTML struktura)
│   └── page.tsx         # Hlavní UI komponenta
├── lib/                 # Sdílené utility funkce (TypeScript)
│   ├── discover.ts      # Logika automatického objevování aplikací
│   ├── i18n.ts          # Mezinárodní podpora (EN/CZ)
│   ├── log-level.ts     # Detekce úrovně logu
│   └── root.ts          # Konfigurace a validace kořenové cesty
├── public/              # Statická prostředí (favicon, ikony atd.)
├── styles/              # Globální CSS (Tailwind základ)
├── package.json         # Závislosti a skripty
├── tsconfig.json        # Konfigurace TypeScriptu
└── tailwind.config.js   # Konfigurace Tailwind CSS
```

## Klíčové oblasti vývoje

### 1. Přidávání nových funkcí
Při přidávání nové funkce:
1. **Backend API** (pokud je potřeba):
   - Vytvořte novou routu v `app/api/[feature]/route.ts`
   - Implementujte obslužné funkce (GET, POST, atd.)
   - Přidejte validaci a zpracování chyb
   - Exportujte jako Next.js Route Handler
2. **Integrace frontend**:
   - Používejte `fetch()` nebo SWR pro získávání dat
   - Aktualizujte UI komponenty v `app/page.tsx`
   - Přidejte novou správu stavu pomocí `useState`/`useReducer`
   - Zvažte dopady na výkon (memoization, debouncing)
3. **Mezinárodní podpora**:
   - Přidejte nové řetězce do slovníků `lib/i18n.ts`
   - Používejte `t()` pomocník pro všechno uživatelské rozhraní
4. **Stylizace**:
   - Používejte utility třídy Tailwind CSS
   - Přidejte vlastní CSS pouze do `app/globals.css` pokud je absolutně nutné

### 2. Úprava objevování aplikací
Pro změnu způsobu, jakým jsou aplikace objeveny:
- Upravte `lib/discover.ts`:
  - Aktualizujte funkci `discoverApps()` pro jinou logiku skenování
  - Upravte `detectFramework()` pro detekci nových frameworků
  - Upravte extrakci metadat ve funkci `getAppInfo()`
- Aktualizujte TypeScript rozhraní, pokud se struktura metadat změní
- Otestujte s různými strukturami projektů

### 3. Změna správy procesů
Pro změnu způsobu spouštění/zastavení aplikací:
- Upravte API routy v `app/api/apps/start/` a `app/api/apps/kill/`
- Aktualizujte parametry `spawn()` pro různé příkazy/argumenty
- Změňte mechanismus sledování logů, pokud je potřeba
- Upravte logiku kontroly zdravosti v `app/api/apps/health/` nebo uvnitř rout start/stop
- Zvažte kompatibilitu s Windows při používání shell-specifických funkcí

### 4. Aktualizace správy logů
Pro změnu způsobu zpracování logů:
- Upravte soubory v `app/api/apps/logs/`:
  - `route.ts`: Nedávný buffer logů
  - `stream/route.ts`: SSE proud logů
  - `clear/route.ts`: Vymazání logů
  - `download/route.ts`: Stažení logů
- Aktualizujte detekci úrovně logu v `lib/log-level.ts` pokud je potřeba
- Změňte strategii bufferování (paměť vs souborová)
- Upravte interval dotazování pro sledování logů

### 5. Aktualizace mezinárodní podpory
Pro přidání nových jazyků nebo úpravu překladů:
- Upravte `lib/i18n.ts`:
  - Přidejte nový kód jazyka do typu `Lang`
  - Přidejte nový slovníkový objekt
  - Aktualizujte funkci `translate()` aby zpracovávala nový jazyk
  - Aktualizujte `detectLang()` pokud měníte výchozí nebo logiku detekce
- Aktualizujte všechny komponenty aby používaly `t()` pomocník
- Přidejte selektor jazyka do UI pokud přidáváte více než 2 jazyky

### 6. Změny UI/UX
Pro úpravy uživatelského rozhraní:
- Dodržujte existující vzory v `app/page.tsx`
- Používejte Tailwind pro responsivní design
- Zvažte přístupnost (aria-tags, navigace klávesnicí)
- Testujte na různých velikostech obrazovky
- Udržujte komponenty malé a zaměřené
- Používejte `React.memo` pro drahé komponenty, když je to vhodné

## Testování vašich změn

### Manuální testování
1. Spusťte vývojový server: `npm run dev`
2. Otevřete [http://localhost:3005](http://localhost:3005)
3. Otestujte konkrétní funkci, kterou jste změnili
4. Ověřte:
   - UI se správně vykresluje
   - API routy vrací očekávaná data
   - Zpracování chyb funguje podle očekávání
   - Žádné regrese v existující funkčnosti
   - Mezinárodní podpora funguje (pokud je relevantní)
   - Nastavení se správně ukládá

### Kontrola TypeScriptu
```bash
# Zkontrolujte typové chyby
npx tsc --noEmit

# Nebo použijte vestavěný skript
npm run type-check
```

### Sestavení pro produkci
```bash
# Vytvořte produkční sestavení
npm run build

# Spusťte produkční server
npm start
```

Poté otestujte na [http://localhost:3005](http://localhost:3005) aby se ujistil:
- Všechny stránky se správně vykreslují
- API routy fungují v produkčním módu
- Žádné nesoulady při hydrataci na straně klienta
- Výkon je přijatelný

## Běžné vývojové úkoly

### Přidání nového atributu aplikace
1. Aktualizujte rozhraní `AppInfo` v `lib/discover.ts`
2. Upravte `getAppInfo()` aby extrahoval nový atribut
3. Aktualizujte `discoverApps()` pokud atribut ovlivňuje filtrování/řazení
4. Přidejte logiku zobrazení v `app/page.tsx` kde je potřeba
5. Přidejte do TypeScript rozhraní v API routách pokud je atribut vystaven
6. Aktualizujte i18n pokud atribut potřebuje popisek

### Změna výchozí složky projektů
1. Upravte `DEFAULT_ROOT` v `lib/root.ts`
2. Aktualizujte dokumentaci v README a docs
3. Zvažte přidání poznámek o migraci pokud se mění ze zaběhlého výchozího

### Přidání nové úrovně logu
1. Aktualizujte typ `LogLevel` v `lib/log-level.ts`
2. Přidejte detekční vzory do příslušného pole (`ERROR_PATTERNS`, atd.)
3. Aktualizujte `levelClass()` mapování tříd CSS pokud je potřeba
4. Přidejte překlad do `lib/i18n.ts`
5. Aktualizujte filtr čipů logu v `app/page.tsx`
6. Aktualizujte zobrazení úrovně logu v záhlaví zásuvky s logy

### Úprava klávesových zkratek
1. Přidejte/odeberte posluchače událostí v `app/page.tsx` useEffect
2. Aktualizujte dokumentaci v uživatelské příručce
3. Zvažte dopady na přístupnost
4. Otestujte konflikty s klávesovými zkratkami prohlížeče

## Úvahy o výkonu

### Optimalizace vykreslování
- Používejte `React.memo` pro komponenty, které přijímají stabilní props
- Memoizujte nákladné výpočty pomocí `useMemo`
- Debounce rychle po sobě jdoucí události (vstupy vyhledávání, změna velikosti okna)
- Virtualizujte dlouhé seznamy pokud >100 položek (zvažte `react-window` nebo podobné)

### Výkon API
- Cache nákladné operace kde je to vhodné
- Používejte efektivní algoritmy pro filtrování/řazení
- Zvažte stránkování pro velké datové sady
- Monitorujte využití paměti v dlouhodobě běžících procesech

### Optimalizace sestavení
- Povolte optimalizace produkce: `npm run build`
- Analyzujte velikost balíčku: `npx next build && npx next export`
- Odstraňte nevyužité závislosti pomocí `npm prune`
- Udržujte TypeScript v přísném režimu pro včasné odhalení problémů

## Řešení problémů během vývoje

### Chyby "Nelze najít modul"
1. Spusťte `npm install` aby se zajistila instalace závislostí
2. Zkontrolujte překlepy v cestách importu
3. Ověřte, že modul existuje v `node_modules/`
4. Zkuste `npm ls <název-modulu>` pro zobrazení stavu instalace

### Port již používán
- Jiný proces používá port 3005
- Změňte port: `PORT=3006 npm run dev`
- Nebo ukončete existující proces: `lsof -ti:3005 | xargs kill -f`

### Chyby TypeScriptu
1. Pozorně čtěte chybovou zprávu - je obvykle přesná
2. Zkontrolujte typové definice v importovaných modulech
3. Ověřte, že nemícháte `undefined` s nullable typy
4. Používejte `as` asercí střídmě a pouze když si jistíte

### Hot Reload nefunguje
1. Ujistěte se, že upravujete soubory v adresáři `launchpad/`
2. Zkontrolujte syntaktické chyby, které zabraňují načtení modulu
3. Zkuste restartovat vývojový server: `Ctrl+C` následně `npm run dev`
4. Zkontrolujte místo na disku a oprávnění k souborům

### Selhání sestavení
1. Spusťte `npx tsc --noEmit` pro izolaci problémů TypeScriptu
2. Zkontrolujte chybějící exports v Route Handlerech
3. Ověřte, že všechny komponenty vrací platný JSX
4. Hledejte `undefined` hodnoty používané jako objekty/react děti

## Kontrolní seznam před odesláním pull requestu

Před odesláním pull requestu:
- [ ] Kód následuje přísný režim TypeScriptu
- [ ] Žádné typy `any` kromě absolutně nutných případů
- [ ] Všechna uživatelská rozhraní používají pomocník `t()`
- [ ] Komponenty jsou malé a zaměřené
- [ ] Tailwind používán pro stylizaci (minimální vlastní CSS)
- [ ] API routy validují všechny vstupy
- [ ] Zpracování chyb je přítomné a informativní
- [ ] Zpráva závazku následuje formát konvenčních závazků
- [ ] Dokumentace aktualizována pokud se změnilo chování vůči uživateli
- [ ] Otestováno manuálně v režimu vývoje
- [ ] Sestavení uspěje: `npm run build`
- [ ] Žádné chyby v konzoli v režimu vývoje
- [ ] Responsivní design zkontrolován na různých velikostech obrazovky
- [ ] Zváženy aspekty přístupnosti (aria-tags, navigace klávesnicí)

## Jak získat pomoc

Pokud narazíte na problémy během vývoje:
1. Zkontrolujte existující dokumentaci v `/docs/`
2. Podívejte se na podobné implementace v kodové bázi
3. Prohledejte uzavřené issues kvůli podobným problémům
4. Zeptejte se v GitHub Discussions
5. Jako poslední možnost vytvořte podrobný issue s:
   - Kroky k reprodukci
   - Očekávané vs skutečné chování
   - Relevantní úryvky kódu
   - Snímky obrazovky nebo chybové protokoly
   - Detaily prostředí (Node.js, OS, prohlížeč)

Šťastné kódování! 🚀
