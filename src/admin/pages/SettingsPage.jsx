import { useEffect, useState } from 'react';
import { api, ApiError } from '../../api/client';
import { TrashIcon } from '../../icons';
import { PasswordRow } from '../../components/PasswordRow';

export function SettingsPage({ showToast }) {
  const [sports, setSports] = useState(null);
  const [newSport, setNewSport] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const data = await api.get('/admin/sports');
    setSports(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function addSport() {
    const name = newSport.trim();
    if (!name) return;
    setSubmitting(true);
    try {
      await api.post('/admin/sports', { name });
      setNewSport('');
      showToast(`${name} added`);
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Unable to add sport');
    } finally {
      setSubmitting(false);
    }
  }

  async function removeSport(sport) {
    try {
      await api.delete(`/admin/sports/${sport.sport_id}`);
      showToast(`${sport.name} removed`);
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Unable to remove sport');
    }
  }

  return (
    <>
      <div className="card elev-sm" style={{ padding: 24, maxWidth: 560, marginBottom: 20 }}>
        <div className="card-kicker">System configuration</div>
        <div className="card-title" style={{ marginBottom: 6 }}>
          Manage sports
        </div>
        <p className="card-body" style={{ marginBottom: 16 }}>
          Sports/teams available when creating coach and player accounts. Add a new one here as soon as MSU stands up a new varsity program
          — no code change needed.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <input
            className="input"
            placeholder="e.g. Badminton"
            value={newSport}
            onChange={(e) => setNewSport(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addSport();
            }}
          />
          <button type="button" className="btn btn-primary" onClick={addSport} disabled={submitting || !newSport.trim()}>
            {submitting ? 'Adding…' : 'Add sport'}
          </button>
        </div>

        {sports === null ? (
          <div className="card-body">Loading sports…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sports.map((s) => (
              <div
                key={s.sport_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--color-divider)',
                }}
              >
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{s.name}</span>
                <button type="button" className="btn btn-ghost btn-icon" aria-label={`Remove ${s.name}`} onClick={() => removeSport(s)}>
                  <TrashIcon />
                </button>
              </div>
            ))}
            {sports.length === 0 && <div style={{ opacity: 0.6, fontSize: 13.5, padding: '8px 0' }}>No sports set up yet.</div>}
          </div>
        )}
      </div>

      <div className="card elev-sm" style={{ padding: 24, maxWidth: 560 }}>
        <div className="card-kicker">Security</div>
        <div className="card-title" style={{ marginBottom: 6 }}>
          Account
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <PasswordRow showToast={showToast} />
        </div>
      </div>
    </>
  );
}
