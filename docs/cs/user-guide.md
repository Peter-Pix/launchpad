# Uživatelská příručka Launchpadu

## Přehled

Launchpad je centrální rozcestník pro všechny vaše lokální vývojové aplikace. Automaticky detekuje projekty s `package.json` dev scriptem, zobrazuje jejich stav, umožňuje spouštění/zastavení jedním klikem, streamuje živé logy a spouští pracovní prostory — vše bez manuální konfigurace.

## Instalace

```bash
git clone https://github.com/Peter-Pix/launchpad.git
cd launchpad
npm install
```

## První spuštění

Ve výchozím nastavení Launchpad prohledává vaši `~/projects` složku po aplikacích. Pro použití jiné složky:

1. Klikněte na ikonu ⚙️ ozubeného kolečka v pravém horním rohu
2. Zadejte cestu ke složce s projekty (např. `/Users/ja/code`)
3. Klikněte na "Uložit"
4. Launchpad automaticky znovu prohledá složku

Můžete také nastavit proměnnou prostředí `LAUNCHPAD_ROOT` před spuštěním:
```bash
LAUNCHPAD_ROOT=/mnt/vyvoj npm run dev
```

## Přehled rozhraní

### Hlavní panel
- **🚀 Launchpad** — název aplikace
- **Statistické pillsky** — celkem aplikací, běžících aplikací, konfliktů portů
- **Přepínač auto-otevřít** — automaticky otevřít aplikaci v prohlížeči po spuštění
- **Přepínač jazyka** — 🇬🇧/🇨🇿 (angličtina/čeština)
- **Nastavení (⚙️)** — konfigurace cesty k projektům
- **Obnovit (↻)** — ruční prohledání na nové/změněné projekty

### Hlavní zobrazení
Detekované aplikace se zobrazují jako karty obsahující:
- **Název aplikace** a **emoji ikona** (založená na detekci frameworku)
- **Indikátor stavu** (● běží zdravě, ● nezdravá, ○ zastaveno)
- **Poslední commit** a **čas vytvoření** (relativní časové údaje)
- **Badge frameworku** (Next.js, Vite, Node, atd.)
- **Tagy** (pokud jsou definované v `package.json`)
- **Akční tlačítka**:
  - 🔗 Otevřít — spustí URL aplikace v nové kartě prohlížeče
  - ⎇ Log — otevře zásuvku s živými logy
  - ▶/✕ Spustit/Zastavit — přepíná stav aplikace (zobrazuje "Spouštím…" při vytížení)
  - ⚠️ Upozornění na konflikt portu (pokud nastane)

### Spodní panel
Zobrazuje cestu pro objevování a užitečné tipy:
- Auto-objevování: skenuje `[cesta]` · nové aplikace se přidávají automaticky
- Rychlé hledání · Běh: `npm run dev`
- ⚙️ pro změnu cesty

### Omnibar (Ctrl+K)
Okamžité fuzzy vyhledávání v:
- Názvech aplikací
- Cestách adresářů
- Tazích (z `package.json`)
Stiskněte **Enter** pro spuštění vybrané aplikace.

### Pracovní prostory (⚡)
Definované skupiny aplikací, které lze spustit/zastavit společně.
Kliknutím na pracovní prostor spustíte všechny jeho členské aplikace jedním klikem.

### Zásuvka s logy
Otevře se po kliknutí na tlačítko ⎇ Log na kartě aplikace:
- **Hlavička**: Název aplikace a cesta k adresáři
- **Živý proud logů** s barevným kódováním úrovní (info/šedá, warn/oranžová, error/červená, debug/modrá)
- **Ovládací prvky**:
  - ▶ Obnovit / ⏸ Pozastavit — přepíná streamování logů
  - ⤓ Stáhnout — uloží logy jako prostý textový soubor
  - 🗑 Vymazat — vymaže paměť logů
  - ✕ Zavřít — zavře zásuvku
- **Filtr čipů**: Vše / INFO / WARN / ERROR / DEBUG
- **Prázdný stav**: zobrazí zprávu, když nejsou k dispozici žádné logy

## Nastavení (⚙️ modal)
Přístupné přes ikonu ozubeného kolečka v hlavním panelu:

### Cesta k projektům
- Složka, kde Launchpad hledá aplikace
- Musí být platný, čitelný adresář
- Uloženo do `localStorage` jako `launchpad.root`
- Obnovení na výchozí hodnotu tlačítkem "↺ Výchozí"

### Auto-otevřít
Když je zapnuté, Launchpad automaticky otevře URL aplikace v nové kartě prohlížeče po jejím spuštění.

### Jazyk
Přepíná mezi angličtinou (🇬🇧) a češtinou (🇨🇿) pro celé UI. Výběr se pamatuje v `localStorage`.

## Klávesové zkratky
- **Ctrl+K** — Zaostřit omnibar (vyhledávání)
- **Esc** — Zavřít omnibar, nastavení modal, nebo zásuvku s logy
- **Enter** (v omnibaru) — Spustit vybranou aplikaci

## Jak to funguje

### Objevování aplikací
Launchpad rekurzivně prohledává nakonfigurovanou složku projektů po:
- Adresářích obsahujících soubor `package.json`
- Který má v objektu `scripts` definovaný skript `dev`

Každá objevená aplikace je uložena do mezipaměti s metadaty:
- Název (z `packagejson.name` nebo název adresáře)
- Framework (detekován ze závislostí: next, vite, node, nebo jiné)
- Git informace (čas posledního commitu, pokud je to git repozitář)
- Čas vytvoření (systémový čas vytvoření souboru)
- Tagy (z `package.launchpad.tags` pole nebo `package.json.keywords`)

### Správa procesů
Když kliknete na "Spustit":
1. Launchpad vytvoří dětský proces spouštějící `npm run dev` v adresáři aplikace
2. Zachytává stdout/stderr procesu pro živé logy
3. Dotazuje se na health endpoint aplikace (pokud je dostupný) nebo používá naslouchání na portu jako heuristiku
4. Proces je sledován podle svého PID a přidruženého portu

Když kliknete na "Zastavit":
1. Launchpad pošle SIGTERM do skupiny procesů
2. Vyčká na graceful shutdown (po časovém limitu přejde na SIGKILL)
3. Vyčistí sledování procesu

### Živé logy
Logy jsou streamovány pomocí Server-Sent Events (SSE) z koncového bodu `/api/apps/logs/stream`:
- Backend sleduje logový soubor aplikace (vytvořený při spuštění procesu)
- Nové řádky jsou odesílány klientovi, jakmile se objeví
- Úrovně logů jsou detekovány pomocí shody vzorů (error/warn/debug/info)
- Klienti mohou pozastavit/obnovit proud bez opětovného připojení

## Konfigurace

### Proměnné prostředí
- `LAUNCHPAD_ROOT` — Přepíše výchozí složku projektů (`~/projects`)
- `PORT` — Změní vlastní port Launchpadu (výchozí 3005)

### Trvale uložená nastavení
Uloženo v `browser.localStorage`:
- `launchpad.root` — Vlastní cesta k projektům
- `launchpad.lang` — Jazyk UI (`en` nebo `cs`)

## Řešení problémů

### "Nebyly nalezeny žádné aplikace"
1. Ověřte cestu k projektům v nastavení (⚙️) je správná
2. Ujistěte se, že adresáře obsahují `package.json` s `dev` scriptem
3. Zkontrolujte konzoli pro chyby oprávnění při přístupu ke složce
4. Zkuste kliknout na tlačítko obnovení (↻)

### Konflikty portů
- Launchpad detekuje, když je nakonfigurovaný port aplikace již obsazený
- Karta aplikace ukazuje upozornění ⚠️ a nedovolí spuštění
- Buď zastavte konfliktní proces, nebo změňte port aplikace

### Aplikace se nezobrazují jako běžící
- Některé frameworky neposkytují spolehlivý health endpoint
- Launchpad se uchyluje k detekci "naslouchá na portu"
- Zkontrolujte živé logy, abyste potvrdili, že aplikace skutečně běžela
- Manuální ověření: otevřete URL aplikace v prohlížeči

### Živé logy se neaktualizují
- Ujistěte se, že jste náhodou nepozastavili proud (tlačítko ⏸)
- Zkuste zavřít a znovu otevřít zásuvku s logy
- Zkontrolujte, že proces aplikace stále běží (indikátor stavu)

## Přispívání

Viz [CONTRIBUTING.cs.md](docs/cs/contributing.md) pro podrobného průvodce přispěvatelem.

## Licence

MIT — viz soubor `LICENSE`.

© 2026 Peter Piskáček
