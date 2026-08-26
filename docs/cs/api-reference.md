# Referenční příručka API

Launchpad poskytuje RESTful API pro správu aplikací, logů a nastavení. Všechny koncové body jsou relativní k základní URL a akceptují volitelný query parametr `?root=` pro přepsání výchozí cesty k projektům.

## Základní URL
```
http://localhost:3005
```

## Aplikace

### GET `/api/apps`
Získá seznam všech objevených aplikací s jejich metadaty.

#### Query Parametry
- `root` (string, volitelné): Přepíše výchozí cestu k projektům

#### odpověď
```json
{
  "apps": [
    {
      "id": "string",           // Jedinečný identifikátor (hash adresáře)
      "name": "string",         // Název aplikace (z package.json nebo dirname)
      "dir": "string",          // Absolutní cesta k adresáři aplikace
      "framework": "next" | "vite" | "node" | "other", // Detekovaný framework
      "tags": string[],         // Tagy z package.launchpad.tags nebo keywords
      "running": boolean,       // Zda je proces aktuálně spuštěný
      "healthy": boolean | null, // Stav kontroly zdravosti (null pokud není dostupný)
      "port": number | null,    // Poslouchávaný port (pokud je detekován)
      "portConflict": boolean,  // Zda je port obsazený jiným procesem
      "createdAt": number,      // Unix timestamp vytvoření adresáře
      "lastCommit": number | null, // Unix timestamp posledního commitu gitu (pokud je applicable)
      "url": string | null      // Detekovaná URL (z package.launchpad.url nebo heuristik)
    }
  ],
  "count": number               // Celkový počet aplikací
}
```

#### Příklad odpovědi
```json
{
  "apps": [
    {
      "id": "a1b2c3d4",
      "name": "my-nextjs-app",
      "dir": "/home/user/projects/my-nextjs-app",
      "framework": "next",
      "tags": ["web", "frontend"],
      "running": true,
      "healthy": true,
      "port": 3000,
      "portConflict": false,
      "createdAt": 1724659200,
      "lastCommit": 1724659200,
      "url": "http://localhost:3000"
    }
  ],
  "count": 1
}
```

### POST `/api/apps/start`
Spustí aplikaci.

#### Tělo požadavku
```json
{
  "dir": string   // Absolutní cesta k adresáři aplikace
}
```

#### odpověď
- `200 OK` při úspěchu
- `400 Bad Request` pokud je adresář neplatný nebo chybí
- `500 Internal Server Error` pokud spuštění selže

### POST `/api/apps/kill`
Zastaví spuštěnou aplikaci.

#### Tělo požadavku
```json
{
  "dir": string   // Absolutní cesta k adresáři aplikace
}
```

#### odpověď
- `200 OK` při úspěchu
- `400 Bad Request` pokud je adresář neplatný
- `500 Internal Server Error` pokud zastavení selže

### GET `/api/apps/workspace`
Získá seznam definovaných pracovních prostorů.

#### odpověď
```json
{
  "workspaces": [
    {
      "name": string,           // Název pracovního prostoru
      "apps": string[]          // Pole ID aplikací
    }
  ]
}
```

#### Příklad odpovědi
```json
{
  "workspaces": [
    {
      "name": "full-stack",
      "apps": ["a1b2c3d4", "e5f6g7h8"]
    }
  ]
}
```

### POST `/api/apps/workspace`
Spustí všechny aplikace v pracovním prostoru.

#### Tělo požadavku
```json
{
  "name": string   // Název pracovního prostoru
}
```

#### odpověď
- `200 OK` při úspěchu
- `400 Bad Request` pokud pracovní prostor nenalezen
- `500 Internal Server Error` pokud spuštění selže

## Logy

### GET `/api/apps/logs`
Získá nedávné záznamy logů pro aplikaci (bufferované v paměti).

#### Query Parametry
- `dir` (string, povinné): URL-encoded absolutní cesta k adresáři aplikace
- `limit` (number, volitelné): Maximální počet řádků k vrácení (výchozí 100)
- `level` (string, volitelné): Filtruj podle úrovně logu (`all`, `info`, `warn`, `error`, `debug`)

#### odpověď
```json
{
  "logs": [
    {
      "id": number,         // Sekvenční ID záznamu logu
      "timestamp": number,  // Unix timestamp přijetí logu
      "level": "info" | "warn" | "error" | "debug",
      "line": string        // Obsah řádku logu
    }
  ],
  "counts": {               // Počet logů podle úrovně
    "info": number,
    "warn": number,
    "error": number,
    "debug": number
  },
  "total": number           // Celkový počet logů v bufferu
}
```

#### Příklad odpovědi
```json
{
  "logs": [
    {
      "id": 1024,
      "timestamp": 1724659200,
      "level": "info",
      "line": "ready - started server on http://localhost:3000"
    }
  ],
  "counts": {
    "info": 150,
    "warn": 5,
    "error": 2,
    "debug": 0
  },
  "total": 157
}
```

### GET `/api/apps/logs/stream`
Streamuje živé logy pro aplikaci přes Server-Sent Events (SSE).

#### Query Parametry
- `dir` (string, povinné): URL-encoded absolutní cesta k adresáři aplikace

#### Formát události
```
data: {"timestamp":1724659200,"level":"info","line":"ready - started server on http://localhost:3000"}

```

#### Spojení
- Otevře SSE spojení, které zůstane otevřené dokud klient nezavře
- Posílá nové řádky logů, jakmile jsou generovány procesem aplikace
- Automaticky se znovu připojí při dočasných síťových problémech
- Odesílá `retry: 3000` k instruování klienta, aby počkal 3 sekundy před znovu připojením při chybě

### POST `/api/apps/logs/clear`
Vymaže buffer logů pro aplikaci.

#### Tělo požadavku
```json
{
  "dir": string   // URL-encoded absolutní cesta k adresáři aplikace
}
```

#### odpověď
- `200 OK` při úspěchu
- `400 Bad Request` pokud je adresář neplatný

### GET `/api/apps/logs/download`
Stáhne buffer logů jako prostý textový soubor.

#### Query Parametry
- `dir` (string, povinné): URL-encoded absolutní cesta k adresáři aplikace

#### odpověď
- `200 OK` s `Content-Type: text/plain`
- `Content-Disposition: attachment; filename="<název-aplikace>-logs.txt"`
- `400 Bad Request` pokud je adresář neplatný

## Nastavení

### GET `/api/settings`
Získá aktuálně nakonfigurovanou cestu k projektům.

#### odpověď
```json
{
  "root": string   // Absolutní cesta k adresáři projektů
}
```

#### Příklad odpovědi
```json
{
  "root": "/home/user/projects"
}
```

### POST `/api/settings`
Validuje a uloží novou cestu k projektům.

#### Tělo požadavku
```json
{
  "value": string   // Navrhovaná nová cesta k projektům
}
```

#### odpověď
- `200 OK` s `{ "root": string }` při úspěchu
- `400 Bad Request` pokud je cesta neplatná (neexistuje nebo není adresář)
- Tělo odpovědi obsahuje chybovou zprávu validace

#### Příklad úspěšné odpovědi
```json
{
  "root": "/mnt/development/projects"
}
```

#### Příklad chybné odpovědi
```json
{
  "error": "Cesta neexistuje nebo není přístupná"
}
```

## Kontrola zdravosti

### GET `/api/apps/health`
Jednoduchý endpoint kontroly zdravosti pro ověření, že API reaguje.

#### odpověď
- `200 OK` s `{ "status": "ok" }`

## Chybové odpovědi

Všechny chybové odpovědi následují tento formát:
```json
{
  "error": "Lidsky čitelná chybová zpráva"
}
```

Běžné HTTP status kódy:
- `200` — Úspěch
- `400` — Špatný požadavek (neplatný vstup)
- `404` — Nenalezeno (koncový bod nebo prostředek nenalezen)
- `500` — Chyba serveru (neočekávaná chyba serveru)

## Bezpečnostní poznámky

- Všechny cesty souborového systému jsou validovány, aby se zabránilo útokům typu directory traversal
- API je určeno **pouze pro lokální použití** — nevystavujte jej veřejným sítím
- Není implementována žádná autentizace, protože se předpokládá důvěryhodné lokální prostředí
- Validace cest zajišťuje, že všechny operace zůstanou v rámci nakonfigurovaného kořene projektů nebo jeho podadresářů

## Omezování rychlosti

Žádné omezování rychlosti není aktuálně implementováno, protože API je navrženo pro nepravidelné ruční nebo lokální automatické použití.

## Verzování

Verze API je svázána s verzí aplikace Launchpad. Zásadní změny budou doprovázeny zvýšením major verze.
