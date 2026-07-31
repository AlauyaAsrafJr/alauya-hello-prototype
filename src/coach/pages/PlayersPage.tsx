import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { CoachProfile, HealthStatus, PlayerHealthRecord, PlayerProfile } from '../../api/domain';
import { DialogShell } from '../../components/modals/DialogShell';
import { Select } from '../../components/Select';
import { EyeIcon, HeartPulseIcon } from '../../icons';
import { formatYearLevel, YEAR_LEVEL_OPTIONS } from '../../utils/yearLevel';

function membershipTag(status: string) {
  if (status === 'active') return 'tag tag-success';
  if (status === 'suspended') return 'tag tag-danger';
  return 'tag tag-neutral';
}

function healthTag(status: string) {
  if (status === 'healthy') return 'tag tag-success';
  if (status === 'recovering') return 'tag tag-warning';
  return 'tag tag-danger';
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
  year_level: string;
}

interface HealthForm {
  status: HealthStatus;
  injury_type: string;
  notes: string;
  expected_return_date: string;
}

const EMPTY_HEALTH_FORM: HealthForm = { status: 'healthy', injury_type: '', notes: '', expected_return_date: '' };

export function PlayersPage({ showToast }: PlayersPageProps) {
  const [players, setPlayers] = useState<PlayerProfile[] | null>(null);
  const [coach, setCoach] = useState<CoachProfile | null>(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<PlayerProfile | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [viewing, setViewing] = useState<PlayerProfile | null>(null);
  const [healthTarget, setHealthTarget] = useState<PlayerProfile | null>(null);
  const [healthForm, setHealthForm] = useState<HealthForm>(EMPTY_HEALTH_FORM);
  const [healthHistory, setHealthHistory] = useState<PlayerHealthRecord[] | null>(null);
  const [savingHealth, setSavingHealth] = useState(false);

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
      year_level: p.year_level ? String(p.year_level) : '',
    });
  }

  async function submitEdit() {
    if (!editing || !form) return;
    await api.patch(`/coach/players/${editing.player_id}`, {
      ...form,
      year_level: form.year_level ? Number(form.year_level) : null,
    });
    setEditing(null);
    showToast(`${form.first_name} ${form.last_name} updated`);
    load(search);
  }

  async function openHealth(p: PlayerProfile) {
    setHealthTarget(p);
    setHealthForm({ ...EMPTY_HEALTH_FORM, status: p.health_status });
    setHealthHistory(null);
    const records = await api.get<PlayerHealthRecord[]>(`/coach/players/${p.player_id}/health`);
    setHealthHistory(records);
  }

  async function submitHealth() {
    if (!healthTarget) return;
    setSavingHealth(true);
    try {
      await api.post(`/coach/players/${healthTarget.player_id}/health`, {
        status: healthForm.status,
        injury_type: healthForm.injury_type || undefined,
        notes: healthForm.notes || undefined,
        expected_return_date: healthForm.expected_return_date || undefined,
      });
      showToast(`${healthTarget.first_name} ${healthTarget.last_name} marked as ${healthForm.status}`);
      setHealthTarget(null);
      load(search);
    } finally {
      setSavingHealth(false);
    }
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
              <th>Year</th>
              <th>Email</th>
              <th>Membership</th>
              <th>Health</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {players?.map((p) => (
              <tr key={p.player_id}>
                <td style={{ fontWeight: 600 }}>{p.first_name} {p.last_name}</td>
                <td style={{ opacity: 0.75 }}>{p.team || '—'}</td>
                <td style={{ opacity: 0.75 }}>{formatYearLevel(p.year_level)}</td>
                <td style={{ opacity: 0.75 }}>{p.email}</td>
                <td><span className={membershipTag(p.membership_status)}>{p.membership_status}</span></td>
                <td><span className={healthTag(p.health_status)} style={{ textTransform: 'capitalize' }}>{p.health_status}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button type="button" className="btn btn-ghost btn-icon" aria-label="View" onClick={() => setViewing(p)}><EyeIcon /></button>
                    <button type="button" className="btn btn-ghost btn-icon" aria-label="Log health" onClick={() => openHealth(p)}><HeartPulseIcon /></button>
                    <button type="button" className="btn btn-secondary" onClick={() => openEdit(p)}>Edit</button>
                  </div>
                </td>
              </tr>
            ))}
            {players && players.length === 0 && (
              <tr><td colSpan={7} style={{ opacity: 0.6, textAlign: 'center', padding: 24 }}>No players found.</td></tr>
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
              ['Year level', formatYearLevel(viewing.year_level)],
              ['Date of birth', viewing.date_of_birth || '—'],
              ['Membership status', viewing.membership_status],
              ['Health status', viewing.health_status],
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
              <label>Year level</label>
              <Select
                value={form.year_level}
                onChange={(v) => setForm({ ...form, year_level: v })}
                placeholder="Not set"
                options={YEAR_LEVEL_OPTIONS}
              />
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

      {healthTarget && (
        <DialogShell
          title={`Player health — ${healthTarget.first_name} ${healthTarget.last_name}`}
          onClose={() => setHealthTarget(null)}
          actions={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setHealthTarget(null)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={submitHealth} disabled={savingHealth}>
                {savingHealth ? 'Saving…' : 'Save status'}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            <div className="field">
              <label>Status</label>
              <Select
                value={healthForm.status}
                onChange={(v) => setHealthForm({ ...healthForm, status: v as HealthStatus })}
                options={[
                  { value: 'healthy', label: 'Healthy' },
                  { value: 'injured', label: 'Injured' },
                  { value: 'recovering', label: 'Recovering' },
                ]}
              />
            </div>
            {healthForm.status !== 'healthy' && (
              <>
                <div className="field">
                  <label>Injury type</label>
                  <input
                    className="input"
                    placeholder="e.g. Ankle sprain"
                    value={healthForm.injury_type}
                    onChange={(e) => setHealthForm({ ...healthForm, injury_type: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Notes</label>
                  <textarea
                    className="input"
                    style={{ minHeight: 70 }}
                    value={healthForm.notes}
                    onChange={(e) => setHealthForm({ ...healthForm, notes: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Expected return date</label>
                  <input
                    className="input"
                    type="date"
                    value={healthForm.expected_return_date}
                    onChange={(e) => setHealthForm({ ...healthForm, expected_return_date: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>

          <div className="card-kicker" style={{ marginBottom: 8 }}>History</div>
          {healthHistory === null ? (
            <div className="card-body">Loading…</div>
          ) : healthHistory.length === 0 ? (
            <div style={{ opacity: 0.6, fontSize: 13 }}>No health records logged yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 180, overflowY: 'auto' }}>
              {healthHistory.map((r) => (
                <div key={r.health_record_id} style={{ paddingBottom: 8, borderBottom: '1px solid var(--color-divider)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className={healthTag(r.status)} style={{ textTransform: 'capitalize' }}>{r.status}</span>
                    <span style={{ fontSize: 11, opacity: 0.55 }}>{r.reported_date}</span>
                  </div>
                  {r.injury_type && <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{r.injury_type}</div>}
                  {r.notes && <div style={{ fontSize: 12.5, opacity: 0.8 }}>{r.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </DialogShell>
      )}
    </>
  );
}
