import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { PlayerProfile } from '../../api/domain';
import { DialogShell } from '../../components/modals/DialogShell';
import { EyeIcon } from '../../icons';

interface PlayersPageProps {
  showToast: (msg: string) => void;
}

interface EditForm {
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  team: string;
  membership_status: string;
}

export function PlayersPage({ showToast }: PlayersPageProps) {
  const [players, setPlayers] = useState<PlayerProfile[] | null>(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<PlayerProfile | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [viewing, setViewing] = useState<PlayerProfile | null>(null);

  async function load(q = '') {
    const data = await api.get<PlayerProfile[]>(`/coach/players${q ? `?q=${encodeURIComponent(q)}` : ''}`);
    setPlayers(data);
  }

  useEffect(() => {
    load();
  }, []);

  function openEdit(p: PlayerProfile) {
    setEditing(p);
    setForm({
      first_name: p.first_name,
      last_name: p.last_name,
      email: p.email,
      contact_number: p.contact_number || '',
      team: p.team || '',
      membership_status: p.membership_status,
    });
  }

  async function submitEdit() {
    if (!editing || !form) return;
    await api.patch(`/coach/players/${editing.player_id}`, form);
    setEditing(null);
    showToast(`${form.first_name} ${form.last_name} updated`);
    load(search);
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          className="input"
          style={{ maxWidth: 300 }}
          placeholder="Search players by name or email"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            load(e.target.value);
          }}
        />
      </div>

      <div className="card elev-sm" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Team</th>
              <th>Email</th>
              <th>Membership</th>
              <th style={{ width: 110 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {players?.map((p) => (
              <tr key={p.player_id}>
                <td style={{ fontWeight: 600 }}>{p.first_name} {p.last_name}</td>
                <td style={{ opacity: 0.75 }}>{p.team || '—'}</td>
                <td style={{ opacity: 0.75 }}>{p.email}</td>
                <td><span className={p.membership_status === 'active' ? 'tag tag-accent' : 'tag tag-neutral'}>{p.membership_status}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button type="button" className="btn btn-ghost btn-icon" aria-label="View" onClick={() => setViewing(p)}><EyeIcon /></button>
                    <button type="button" className="btn btn-secondary" onClick={() => openEdit(p)}>Edit</button>
                  </div>
                </td>
              </tr>
            ))}
            {players && players.length === 0 && (
              <tr><td colSpan={5} style={{ opacity: 0.6, textAlign: 'center', padding: 24 }}>No players found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {viewing && (
        <DialogShell title={`${viewing.first_name} ${viewing.last_name}`} onClose={() => setViewing(null)} actions={<button type="button" className="btn btn-secondary" onClick={() => setViewing(null)}>Close</button>}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              ['Email', viewing.email],
              ['Contact number', viewing.contact_number || '—'],
              ['Team', viewing.team || '—'],
              ['Date of birth', viewing.date_of_birth || '—'],
              ['Membership status', viewing.membership_status],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-divider)', fontSize: 13.5 }}>
                <span style={{ opacity: 0.6 }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </DialogShell>
      )}

      {editing && form && (
        <DialogShell
          title={`Edit ${editing.first_name} ${editing.last_name}`}
          onClose={() => setEditing(null)}
          actions={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={submitEdit}>Save changes</button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label>First name</label>
                <input className="input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div className="field">
                <label>Last name</label>
                <input className="input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <label>Contact number</label>
              <input className="input" value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} />
            </div>
            <div className="field">
              <label>Team</label>
              <input className="input" value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} />
            </div>
            <div className="field">
              <label>Membership status</label>
              <select className="input" value={form.membership_status} onChange={(e) => setForm({ ...form, membership_status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </DialogShell>
      )}
    </>
  );
}
