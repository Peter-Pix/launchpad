'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { detectLevel, levelClass, type LogLevel } from '@/lib/log-level';

interface AppInfo {
  id: string;
  name: string;
  dir: string;
  path: string;
  framework: 'next' | 'vite' | 'node' | 'other';
  devScript: string;
  port: number | null;
  running: boolean;
  healthy: boolean | null;
  url: string | null;
  hasPackageJson: boolean;
  portConflict: boolean;
  icon: string | null;
  tags: string[];
  workspaces: string[];
  lastCommit: number | null;
  createdAt: number | null;
}

interface ApiResponse {
  apps: AppInfo[];
  count: number;
  generatedAt: string;
}

const FRAMEWORK_LABEL: Record<AppInfo['framework'], string> = {
  next: 'Next.js',
  vite: 'Vite',
  node: 'Node',
  other: 'App',
};


function formatRelativeTime(ts: number | null): string | null {
  if (!ts) return null;
  const diff = Date.now() / 1000 - ts;
  if (diff < 60) return 'právě teď';
  if (diff < 3600) return `před ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `před ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `před ${Math.floor(diff / 86400)} d`;
  if (diff < 2592000) return `před ${Math.floor(diff / 604800)} týd`;
  if (diff < 31536000) return `před ${Math.floor(diff / 2592000)} měs`;
  return `před ${Math.floor(diff / 31536000)} r`;
}

function formatDate(ts: number | null): string {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

const AUTO_OPEN_KEY = 'launch…Open';

interface LogEntry {
  id: number;
  line: string;
  level: LogLevel;
  ts: number;
}

export default function Home() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [autoOpen, setAutoOpen] = useState<boolean>(true);
  const [activeTag, setActiveTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'az' | 'lastCommit' | 'createdAt'>('az');
  const [frameworkFilter, setFrameworkFilter] = useState<'all' | 'next' | 'vite' | 'other'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'offline'>('all');
  const [omnibarOpen, setOmnibarOpen] = useState(false);
  const [omnibarQuery, setOmnibarQuery] = useState('');

  // Log drawer state
  const [logApp, setLogApp] = useState<AppInfo | null>(null);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<LogLevel | 'all'>('all');
  const [logPaused, setLogPaused] = useState(false);
  const logIdCounter = useRef(0);
  const logEndRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);

  const omnibarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTO_OPEN_KEY);
      if (stored !== null) setAutoOpen(stored === 'true');
    } catch {}
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/apps', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Nepodařilo se načíst aplikace');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOmnibarOpen((o) => !o);
      }
      if (e.key === 'Escape') {
        setOmnibarOpen(false);
        setLogApp(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (omnibarOpen) setTimeout(() => omnibarRef.current?.focus(), 50);
  }, [omnibarOpen]);

  // SSE live log stream
  useEffect(() => {
    if (!logApp) return;
    setLogEntries([]);
    logIdCounter.current = 0;

    const es = new EventSource(`/api/apps/logs/stream?dir=${encodeURIComponent(logApp.dir)}`);
    sseRef.current = es;

    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'line' && msg.line) {
          if (logPaused) return;
          setLogEntries((prev) => {
            const next = [...prev, { id: ++logIdCounter.current, line: msg.line, level: detectLevel(msg.line), ts: Date.now() }];
            return next.slice(-500); // držíme posledních 500 řádků v UI
          });
        }
      } catch {}
    };

    es.onerror = () => {
      // Auto-reconnectuje se automaticky, pokud server vrací 200. Pokud 403/404, EventSource se zastaví.
    };

    return () => {
      es.close();
      sseRef.current = null;
    };
  }, [logApp?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll log drawer na konec, pokud není pozastaveno
  useEffect(() => {
    if (!logPaused && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logEntries, logPaused]);

  const toggleAutoOpen = () => {
    setAutoOpen((prev) => {
      const next = !prev;
      try { localStorage.setItem(AUTO_OPEN_KEY, String(next)); } catch {}
      return next;
    });
  };

  const openApp = (app: AppInfo) => {
    if (app.url) window.open(app.url, '_blank', 'noopener,noreferrer');
  };

  const startApp = async (app: AppInfo) => {
    setBusy(app.id);
    if (autoOpen && app.url) openApp(app);
    try {
      const res = await fetch('/api/apps/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dir: app.dir }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      setTimeout(load, 1500);
    } catch (e: any) {
      alert(`Chyba při startu: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  const startWorkspace = async (dirs: string[]) => {
    setBusy('__workspace__');
    try {
      const res = await fetch('/api/apps/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dirs }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const j = await res.json();
      if (autoOpen) {
        for (const dir of dirs) {
          const app = data?.apps.find((a) => a.dir === dir);
          if (app?.url && j.results?.[dir]?.ok) openApp(app);
        }
      }
      setTimeout(load, 2000);
    } catch (e: any) {
      alert(`Chyba při startu workspace: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  const killApp = async (app: AppInfo) => {
    if (!confirm(`Zastavit aplikaci "${app.name}"?`)) return;
    setBusy(app.id);
    try {
      const res = await fetch('/api/apps/kill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dir: app.dir }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      setTimeout(load, 2000);
    } catch (e: any) {
      alert(`Chyba při zastavení: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  const openLogs = (app: AppInfo) => {
    setLogApp(app);
    setLogEntries([]);
    setLogFilter('all');
    setLogPaused(false);
  };

  const clearLogs = async () => {
    if (!logApp) return;
    try {
      const res = await fetch('/api/apps/logs/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dir: logApp.dir }),
      });
      if (res.ok) setLogEntries([]);
    } catch {}
  };

  const downloadLogs = () => {
    if (!logApp) return;
    window.open(`/api/apps/logs/download?dir=${encodeURIComponent(logApp.dir)}`, '_blank');
  };

  // Derived data
  const apps = data?.apps ?? [];
  const allTags = Array.from(new Set(apps.flatMap((a) => a.tags))).sort();
  const runningCount = apps.filter((a) => a.running).length ?? 0;
  const conflictCount = apps.filter((a) => a.portConflict).length ?? 0;

  // Live hledání + filtry
  const q = searchQuery.trim().toLowerCase();
  const filteredApps = apps
    .filter((a) => activeTag === 'all' || a.tags.includes(activeTag))
    .filter((a) => frameworkFilter === 'all' || a.framework === frameworkFilter)
    .filter((a) => statusFilter === 'all' || (statusFilter === 'running' ? a.running : !a.running))
    .filter((a) => !q || (a.name + ' ' + a.dir + ' ' + a.tags.join(' ')).toLowerCase().includes(q))
    .sort((a, b) => {
      if (sortBy === 'lastCommit') return (b.lastCommit ?? 0) - (a.lastCommit ?? 0);
      if (sortBy === 'createdAt') return (b.createdAt ?? 0) - (a.createdAt ?? 0);
      return a.name.localeCompare(b.name);
    });

  const workspaceNames = Array.from(new Set(apps.flatMap((a) => a.workspaces))).sort();
  const workspaceApps = (name: string) => apps.filter((a) => a.workspaces.includes(name));

  const omnibarResults = omnibarQuery.trim()
    ? apps.filter((a) =>
        (a.name + ' ' + a.dir + ' ' + a.tags.join(' ')).toLowerCase().includes(omnibarQuery.toLowerCase())
      ).slice(0, 8)
    : apps.slice(0, 8);

  const filteredLogEntries = useMemo(() => {
    if (logFilter === 'all') return logEntries;
    return logEntries.filter((e) => e.level === logFilter);
  }, [logEntries, logFilter]);

  const logCounts = useMemo(() => {
    return {
      all: logEntries.length,
      info: logEntries.filter((e) => e.level === 'info').length,
      warn: logEntries.filter((e) => e.level === 'warn').length,
      error: logEntries.filter((e) => e.level === 'error').length,
      debug: logEntries.filter((e) => e.level === 'debug').length,
    };
  }, [logEntries]);

  const renderIcon = (app: AppInfo) => {
    if (app.icon) {
      if (app.icon.startsWith('http') || app.icon.startsWith('/')) {
        return <img src={app.icon} alt="" className="app-icon-img" />;
      }
      return <span className="app-icon-emoji">{app.icon}</span>;
    }
    return <span className="app-icon-emoji">📦</span>;
  };

  return (
    <div className="container">
      <header>
        <div>
          <h1>🚀 Launchpad</h1>
          <div className="subtitle">Všechny aplikace na jednom místě — nové se přidají automaticky</div>
        </div>
        <div className="stats">
          <span className="stat-pill"><b>{data?.count ?? '…'}</b> aplikací</span>
          <span className="stat-pill"><b style={{ color: 'var(--green)' }}>{runningCount}</b> běží</span>
          {conflictCount > 0 && (
            <span className="stat-pill"><b style={{ color: 'var(--amber)' }}>{conflictCount}</b> konflikt portu</span>
          )}
          <label className="settings-toggle" title="Po spuštění aplikace ji automaticky otevřít v nové kartě">
            <span className="settings-label">Auto-otevřít</span>
            <input type="checkbox" checked={autoOpen} onChange={toggleAutoOpen} />
            <span className="toggle-track"><span className="toggle-thumb" /></span>
          </label>
          <button className="btn" onClick={load} style={{ flex: 'none', padding: '0.4rem 0.9rem' }}>↻ Obnovit</button>
        </div>
      </header>

      {/* Live hledání + filtry */}
      <div className="search-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Hledat projekt… (název, adresář, tag)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')} title="Vymazat">✕</button>
          )}
        </div>
        <div className="search-filters">
          <select
            className="filter-select"
            value={frameworkFilter}
            onChange={(e) => setFrameworkFilter(e.target.value as any)}
            title="Filtr podle frameworku"
          >
            <option value="all">Framework: vše</option>
            <option value="next">Next.js</option>
            <option value="vite">Vite</option>
            <option value="other">Other</option>
          </select>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            title="Filtr podle stavu"
          >
            <option value="all">Stav: vše</option>
            <option value="running">Běží</option>
            <option value="offline">Offline</option>
          </select>
          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            title="Řazení"
          >
            <option value="az">A–Z</option>
            <option value="lastCommit">Poslední commit</option>
            <option value="createdAt">Datum vytvoření</option>
          </select>
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="tag-bar">
          <button className={`tag-chip ${activeTag === 'all' ? 'active' : ''}`} onClick={() => setActiveTag('all')}>Vše</button>
          {allTags.map((t) => (
            <button key={t} className={`tag-chip ${activeTag === t ? 'active' : ''}`} onClick={() => setActiveTag(t)}>{t}</button>
          ))}
        </div>
      )}

      {workspaceNames.length > 0 && (
        <div className="workspaces">
          <div className="workspaces-title">⚡ Workspaces</div>
          <div className="workspaces-grid">
            {workspaceNames.map((name) => {
              const wApps = workspaceApps(name);
              const allRunning = wApps.length > 0 && wApps.every((a) => a.running);
              return (
                <div key={name} className="workspace-card">
                  <div className="workspace-name">{name}</div>
                  <div className="workspace-apps">
                    {wApps.map((a) => (
                      <span key={a.id} className={`workspace-app ${a.running ? 'running' : ''}`}>{a.name}</span>
                    ))}
                  </div>
                  <button
                    className="btn primary"
                    onClick={() => startWorkspace(wApps.map((a) => a.dir))}
                    disabled={busy === '__workspace__' || allRunning}
                  >
                    {allRunning ? 'Vše běží ✓' : busy === '__workspace__' ? 'Spouštím…' : `▶ Spustit (${wApps.length})`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loading && <div className="loading">Načítám aplikace…</div>}
      {error && <div className="error">Chyba: {error}</div>}

      {!loading && !error && data && (
        filteredApps.length === 0 ? (
          <div className="empty">
            <p>Žádné aplikace {activeTag !== 'all' ? `v kategorii "${activeTag}"` : ''} nenalezeny.</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
              Skenuji <code>~/projects/*</code> — přidej nový projekt s <code>package.json</code> a objeví se tady.
            </p>
          </div>
        ) : (
          <div className="grid">
            {filteredApps.map((app) => (
              <div key={app.id} className={`card ${app.running ? 'running' : ''}`}>
                <div className="card-top">
                  <div className="card-title-row">
                    {renderIcon(app)}
                    <div>
                      <div className="card-name">{app.name}</div>
                      <div className="card-dir">{app.dir}</div>
                    </div>
                  </div>
                  <span className={`badge ${app.framework}`}>{FRAMEWORK_LABEL[app.framework]}</span>
                </div>

                <div className="status-row" title={app.running ? (app.healthy === false ? 'Běží, ale neodpovídá na health-check' : 'Běží a naslouchá') : 'Zastaveno'}>
                  <span className={`dot ${app.running ? (app.healthy === false ? 'unhealthy' : 'running') : 'stopped'}`} />
                  <span className={`status-text ${app.running ? (app.healthy === false ? 'unhealthy' : 'running') : 'stopped'}`}>
                    {app.running ? (app.healthy === false ? 'Nezdravá' : 'Běží') : 'Zastaveno'}
                  </span>
                  {app.port && <span className="port">:{app.port}</span>}
                </div>

                {(app.lastCommit || app.createdAt) && (
                  <div className="card-meta">
                    {app.lastCommit && (
                      <span className="meta-item" title={`Poslední commit: ${formatDate(app.lastCommit)}`}>
                        <span className="meta-icon">🕒</span> commit {formatRelativeTime(app.lastCommit)}
                      </span>
                    )}
                    {app.createdAt && (
                      <span className="meta-item" title={`Vytvořeno: ${formatDate(app.createdAt)}`}>
                        <span className="meta-icon">📅</span> {formatRelativeTime(app.createdAt)}
                      </span>
                    )}
                  </div>
                )}

                {app.tags.length > 0 && (
                  <div className="card-tags">
                    {app.tags.map((t) => <span key={t} className="mini-tag">{t}</span>)}
                  </div>
                )}

                {app.portConflict && (
                  <div className="conflict-warning">
                    ⚠️ Port {app.port} je obsazený jinou aplikací — nelze spustit, dokud se neuvolní.
                  </div>
                )}

                <div className="card-actions">
                  {app.running && app.url ? (
                    <>
                      <a className="btn primary" href={app.url} target="_blank" rel="noopener noreferrer">Otevřít ↗</a>
                      <button className="btn" onClick={() => openLogs(app)} title="Zobrazit logy">⎇ Log</button>
                      <button className="btn danger" onClick={() => killApp(app)} disabled={busy === app.id} title="Zastavit aplikaci">
                        {busy === app.id ? '…' : '✕'}
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn primary"
                      onClick={() => startApp(app)}
                      disabled={busy === app.id || app.portConflict}
                      title={app.portConflict ? 'Port je obsazený' : 'Spustit aplikaci'}
                    >
                      {busy === app.id ? 'Spouštím…' : '▶ Spustit'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <div className="footer">
        <p>
          Auto-discovery: skenuje <code>~/projects/*</code> · nové aplikace se přidají samy.
          <br />
          <kbd>Ctrl</kbd>+<kbd>K</kbd> — rychlé hledání · Běh: <code>npm run dev</code> · port 3005
        </p>
      </div>

      {omnibarOpen && (
        <div className="omnibar-overlay" onClick={() => setOmnibarOpen(false)}>
          <div className="omnibar" onClick={(e) => e.stopPropagation()}>
            <div className="omnibar-input-row">
              <span className="omnibar-icon">🔍</span>
              <input
                ref={omnibarRef}
                value={omnibarQuery}
                onChange={(e) => setOmnibarQuery(e.target.value)}
                placeholder="Hledat aplikaci… (Enter = spustit)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && omnibarResults.length > 0) {
                    const app = omnibarResults[0];
                    setOmnibarOpen(false);
                    setOmnibarQuery('');
                    if (app.running) openApp(app);
                    else startApp(app);
                  }
                }}
              />
              <kbd>Esc</kbd>
            </div>
            <div className="omnibar-results">
              {omnibarResults.length === 0 ? (
                <div className="omnibar-empty">Žádné výsledky</div>
              ) : (
                omnibarResults.map((app) => (
                  <button
                    key={app.id}
                    className="omnibar-item"
                    onClick={() => {
                      setOmnibarOpen(false);
                      setOmnibarQuery('');
                      if (app.running) openApp(app);
                      else startApp(app);
                    }}
                  >
                    <span className="omnibar-item-icon">{renderIcon(app)}</span>
                    <span className="omnibar-item-name">{app.name}</span>
                    <span className="omnibar-item-dir">{app.dir}</span>
                    <span className={`dot ${app.running ? 'running' : 'stopped'}`} />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {logApp && (
        <div className="log-drawer">
          <div className="log-drawer-header">
            <div className="log-drawer-title">
              <span className="log-drawer-dot" />
              Logy: <b>{logApp.name}</b>
              <span className="log-drawer-dir">{logApp.dir}</span>
            </div>
            <div className="log-drawer-actions">
              <button className={`btn ${logPaused ? 'primary' : ''}`} onClick={() => setLogPaused((p) => !p)} style={{ flex: 'none', padding: '0.3rem 0.8rem' }}>
                {logPaused ? '▶ Pustit' : '⏸ Pauza'}
              </button>
              <button className="btn" onClick={downloadLogs} style={{ flex: 'none', padding: '0.3rem 0.8rem' }}>⤓ Stáhnout</button>
              <button className="btn danger" onClick={clearLogs} style={{ flex: 'none', padding: '0.3rem 0.8rem' }}>🗑 Vymazat</button>
              <button className="btn" onClick={() => setLogApp(null)} style={{ flex: 'none', padding: '0.3rem 0.8rem' }}>✕ Zavřít</button>
            </div>
          </div>

          <div className="log-filter-bar">
            {(['all', 'info', 'warn', 'error', 'debug'] as const).map((lvl) => (
              <button
                key={lvl}
                className={`log-filter-chip ${logFilter === lvl ? 'active' : ''} log-filter-${lvl}`}
                onClick={() => setLogFilter(lvl)}
              >
                {lvl === 'all' ? 'Vše' : lvl.toUpperCase()} {logCounts[lvl] > 0 && <span className="log-filter-count">{logCounts[lvl]}</span>}
              </button>
            ))}
          </div>

          <div className="log-drawer-body">
            {filteredLogEntries.length === 0 ? (
              <div className="log-empty">Zatím žádné logy. Spusť aplikaci a výstup se objeví tady.</div>
            ) : (
              filteredLogEntries.map((entry) => (
                <div key={entry.id} className={`log-line ${levelClass(entry.level)}`}>{entry.line}</div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
