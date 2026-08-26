# Launchpad — Roadmapa

> Stav: Funkční rozcestník. Auto-discovery, status, spuštění, omnibar (Ctrl+K), workspaces, live logy, **konfigurovatelná cesta k projektům**.

## Co to je
Centrální rozcestník pro všechny aplikace v zvoleném adresáři (default `~/projects`). Automaticky detekuje nové aplikace (package.json s dev scriptem).

## Cíl
Zpevnit — řešit edge cases, které nastávají při reálném používání.

## Fáze

### Fáze 1 — Robustnost (hotové)
- [x] Konflikt portu: lépe detekovat i při restartu (stale port od zabitého procesu)
- [x] Error handling: co když `npm run dev` selže hned (chybí deps, špatný script)
- [x] Čištění mrtvých procesů: pokud aplikace skončila, ale port zůstal → kill

### Fáze 2 — UX (hotové + dolaď)
- [x] Filtrování aplikací (podle frameworku / stavu běží)
- [x] Persistovat poslední spuštěné aplikace (rychlý restart)
- [x] Vyhledávání v Omnibaru: zvýraznit match
- [x] **Konfigurovatelná cesta k projektům** (⚙️ ozubené kolečko → localStorage → query param `root`)

### Fáze 3 — Rozšíření (volitelné)
- [ ] Workspace groups: uložit a spouštět sestavy aplikací jedním klikem

## Blokery
- Nic — projekt funkční, jde o vyladění.
