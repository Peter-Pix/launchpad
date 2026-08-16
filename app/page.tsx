'use client';

import { useEffect, useState, useCallback } from 'react';

interface AppInfo {
  id: string;
  name: string;
  dir: string;
  path: string;
  framework: 'next' | 'vite' | 'node' | 'other';
  devScript: string;
  port: number | null;
  running: boolean;
  url: string | null;
  hasPackageJson: boolean;
  portConflict: boolean;
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

export default function Home() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null); // dir aplikace, se kterou se pracuje

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

  // Auto-refresh každých 10s pro aktuální status
  useEffect(() => {
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  const startApp = async (app: AppInfo) => {
    setBusy(app.id);
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
      setTimeout(load, 3000);
    } catch (e: any) {
      alert(`Chyba při startu: ${e.message}`);
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

  const runningCount = data?.apps.filter((a) => a.running).length ?? 0;
  const conflictCount = data?.apps.filter((a) => a.portConflict).length ?? 0;

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
          <button className="btn" onClick={load} style={{ flex: 'none', padding: '0.4rem 0.9rem' }}>↻ Obnovit</button>
        </div>
      </header>

      {loading && <div className="loading">Načítám aplikace…</div>}
      {error && <div className="error">Chyba: {error}</div>}

      {!loading && !error && data && (
        data.apps.length === 0 ? (
          <div className="empty">
            <p>Žádné aplikace nenalezeny.</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
              Skenuji <code>~/projects/*</code> — přidej nový projekt s <code>package.json</code> a objeví se tady.
            </p>
          </div>
        ) : (
          <div className="grid">
            {data.apps.map((app) => (
              <div key={app.id} className={`card ${app.running ? 'running' : ''}`}>
                <div className="card-top">
                  <div>
                    <div className="card-name">{app.name}</div>
                    <div className="card-dir">{app.dir}</div>
                  </div>
                  <span className={`badge ${app.framework}`}>{FRAMEWORK_LABEL[app.framework]}</span>
                </div>

                <div className="status-row">
                  <span className={`dot ${app.running ? 'running' : 'stopped'}`} />
                  <span className={`status-text ${app.running ? 'running' : 'stopped'}`}>
                    {app.running ? 'Běží' : 'Zastaveno'}
                  </span>
                  {app.port && <span className="port">:{app.port}</span>}
                </div>

                {app.portConflict && (
                  <div className="conflict-warning">
                    ⚠️ Port {app.port} je obsazený jinou aplikací — nelze spustit, dokud se neuvolní.
                  </div>
                )}

                <div className="card-actions">
                  {app.running && app.url ? (
                    <>
                      <a className="btn primary" href={app.url} target="_blank" rel="noopener noreferrer">
                        Otevřít ↗
                      </a>
                      <button
                        className="btn danger"
                        onClick={() => killApp(app)}
                        disabled={busy === app.id}
                        title="Zastavit aplikaci"
                      >
                        {busy === app.id ? '…' : '✕ Kill'}
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
          Běh: <code>npm run dev</code> v <code>~/projects/launchpad</code> · port 3005
        </p>
      </div>
    </div>
  );
}
