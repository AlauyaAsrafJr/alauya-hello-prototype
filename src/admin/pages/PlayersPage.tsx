import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { PlayerProfile } from '../../api/domain';
import { DialogShell } from '../../components/modals/DialogShell';
import { EyeIcon } from '../../icons';

function membershipTag(status: string) {
  if (status === 'active') return 'tag tag-success';
  if (status === 'suspended') return 'tag tag-danger';
  return 'tag tag-neutral';
}

export function PlayersPage() {
  const [players, setPlayers] = useState<PlayerProfile[] | null>(null);
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState<PlayerProfile | null>(null);

  useEffect(() => {
    api.get<PlayerProfile[]>('/admin/players').then(setPlayers);
  }, []);

  const filtered = (players || []).filter(
    (p) =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input className="input" style={{ maxWidth: 300 }} placeholder="Search players by name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card elev-sm" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Team</th>
              <th>Email</th>
              <th>Membership</th>
              <th>Account status</th>
              <th style={{ width: 80 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.player_id}>
                <td style={{ fontWeight: 600 }}>{p.first_name} {p.last_name}</td>
                <td style={{ opacity: 0.75 }}>{p.team || '—'}</td>
                <td style={{ opacity: 0.75 }}>{p.email}</td>
                <td><span className={membershipTag(p.membership_status)}>{p.membership_status}</span></td>
                <td><span className={p.is_active ? 'tag tag-success' : 'tag tag-danger'}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>
                  <button type="button" className="btn btn-ghost btn-icon" aria-label="View" onClick={() => setViewing(p)}><EyeIcon /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ opacity: 0.6, textAlign: 'center', padding: 24 }}>No players found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {viewing && (
        <DialogShell title={`${viewing.first_name} ${viewing.last_name}`} onClose={() => setViewing(null)} actions={<button type="button" className="btn btn-secondary" onClick={() => setViewing(null)}>Close</button>}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              ['Username', viewing.username || '—'],
              ['Email', viewing.email],
              ['Contact number', viewing.contact_number || '—'],
              ['Team', viewing.team || '—'],
              ['Date of birth', viewing.date_of_birth || '—'],
              ['Membership status', viewing.membership_status],
              ['Account status', viewing.is_active ? 'Active' : 'Inactive'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-divider)', fontSize: 13.5 }}>
                <span style={{ opacity: 0.6 }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </DialogShell>
      )}
    </>
  );
}
