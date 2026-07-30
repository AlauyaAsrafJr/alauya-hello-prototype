import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { CoachProfile, PlayerProfile } from '../../api/domain';
import { DialogShell } from '../../components/modals/DialogShell';
import { Select } from '../../components/Select';
import { EyeIcon } from '../../icons';

function membershipTag(status: string) {
  if (status === 'active') return 'tag tag-success';
  if (status === 'suspended') return 'tag tag-danger';
  return 'tag tag-neutral';
}

interface PlayersPageProps {
  showToast: (msg: string) => void;
}

interface EditForm {
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  membership_status: string;
}

export function PlayersPage({ showToast }: PlayersPageProps) {
  const [players, setPlayers] = useState<PlayerProfile[] | null>(null);
  const [coach, setCoach] = useState<CoachProfile | null>(null);
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
    api.get<CoachProfile>('/coach/profile').then(setCoach);
  }, []);

  function openEdit(p: PlayerProfile) {
    setEditing(p);
    setForm({
      first_name: p.first_name,
      last_name: p.last_name,
      email: p.email,
      contact_number: p.contact_number || '',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        {coach && (
          <span className={coach.specialization ? 'tag tag-info' : 'tag tag-warning'}>
            {coach.specialization ? `Team: ${coach.specialization}` : 'No team assigned'}
          </span>
        )}
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

      {coach && !coach.specialization && (
        <div className="card elev-sm" style={{ padding: 16, marginBottom: 16 }}>
          <p className="card-body" style={{ margin: 0 }}>
            You don't have a team assigned yet, so no players are showing. Ask an administrator to set your
            specialization from Manage Users.
          </p>
        </div>
      )}

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
                <td><span className={membershipTag(p.membership_status)}>{p.membership_status}</span></td>
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
              <input className="input" value={editing.team || '—'} disabled />
              <p style={{ fontSize: 11.5, opacity: 0.6, marginTop: 4 }}>Team assignment is managed by an administrator.</p>
            </div>
            <div className="field">
              <label>Membership status</label>
              <Select
                value={form.membership_status}
                onChange={(v) => setForm({ ...form, membership_status: v })}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'suspended', label: 'Suspended' },
                ]}
              />
            </div>
          </div>
        </DialogShell>
      )}
    </>
  );
}
