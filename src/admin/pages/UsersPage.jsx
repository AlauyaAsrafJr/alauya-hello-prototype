import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { DialogShell } from '../../components/modals/DialogShell';
import { ConfirmDialog } from '../../components/modals/ConfirmDialog';
import { ArchiveIcon, EyeIcon, PlusIcon } from '../../icons';
import { Select } from '../../components/Select';
import { YEAR_LEVEL_OPTIONS } from '../../utils/yearLevel';

const EMPTY_FORM = {
  username: '',
  password: '',
  role: 'coach',
  first_name: '',
  middle_name: '',
  last_name: '',
  email: '',
  team: '',
  year_level: '',
};

export function UsersPage({ showToast }) {
  const [users, setUsers] = useState(null);
  const [sports, setSports] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [viewing, setViewing] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [tempPassword, setTempPassword] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);

  async function load() {
    const query = roleFilter === 'all' ? '' : `?role=${roleFilter}`;
    const data = await api.get(`/admin/users${query}`);
    setUsers(data);
  }

  async function loadSports() {
    const data = await api.get('/admin/sports');
    setSports(data);
    setForm((prev) => (prev.team ? prev : { ...prev, team: data[0]?.name || '' }));
  }

  useEffect(() => {
    load();
  }, [roleFilter]);

  useEffect(() => {
    loadSports();
  }, []);

  const filtered = (users || []).filter(
    (u) =>
      u.display_name.toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()),
  );

  async function submitAdd() {
    const needsTeam = form.role === 'coach' || form.role === 'player';
    await api.post('/admin/users', {
      ...form,
      // Coach accounts use `specialization`, player accounts use `team` — send both
      // so the backend can pick the one relevant to the chosen role.
      team: needsTeam ? form.team : undefined,
      specialization: needsTeam ? form.team : undefined,
      year_level: form.role === 'player' && form.year_level ? Number(form.year_level) : undefined,
    });
    setAddOpen(false);
    setForm(EMPTY_FORM);
    const fullName = [form.first_name, form.middle_name, form.last_name].filter(Boolean).join(' ');
    showToast(`${fullName} added as ${form.role}`);
    load();
  }

  async function toggleActive(u) {
    await api.post(`/admin/users/${u.user_id}/${u.is_active ? 'deactivate' : 'activate'}`);
    showToast(`${u.display_name} ${u.is_active ? 'deactivated' : 'reactivated'}`);
    load();
  }

  async function archiveUser(u) {
    await api.post(`/admin/users/${u.user_id}/archive`);
    showToast(`${u.display_name} archived`);
    setArchiveTarget(null);
    load();
  }

  async function submitResetPassword() {
    if (!resetTarget) return;
    const res = await api.post(`/admin/users/${resetTarget.user_id}/reset-password`);
    setTempPassword(res.temporary_password);
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          className="input"
          style={{ maxWidth: 280 }}
          placeholder="Search users by name, username, or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          style={{ maxWidth: 170 }}
          value={roleFilter}
          onChange={(v) => setRoleFilter(v)}
          options={[
            { value: 'all', label: 'All roles' },
            { value: 'player', label: 'Player' },
            { value: 'coach', label: 'Coach' },
            { value: 'admin', label: 'Admin' },
          ]}
        />
        <div style={{ flex: 1 }} />
        <button type="button" className="btn btn-primary" onClick={() => setAddOpen(true)}>
          <PlusIcon />
          Add user
        </button>
      </div>

      <div className="card elev-sm" style={{ padding: 0, overflowX: 'auto', overflowY: 'hidden' }}>
        <div className="table-wrap">
          <table className="table" style={{ minWidth: 1080 }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Team</th>
                <th>Status</th>
                <th>Last login</th>
                <th style={{ width: 250 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.user_id}>
                  <td style={{ fontWeight: 600 }}>{u.display_name}</td>
                  <td style={{ opacity: 0.75 }}>{u.username}</td>
                  <td style={{ opacity: 0.75 }}>{u.email || '—'}</td>
                  <td>
                    <span className="tag tag-neutral" style={{ textTransform: 'capitalize' }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ opacity: 0.75 }}>{u.team || '—'}</td>
                  <td>
                    <span className={u.is_active ? 'tag tag-success' : 'tag tag-danger'}>{u.is_active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td style={{ opacity: 0.65 }}>{u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
                      <button type="button" className="btn btn-ghost btn-icon" aria-label="View" onClick={() => setViewing(u)}>
                        <EyeIcon />
                      </button>
                      <button type="button" className="btn btn-ghost" style={{ whiteSpace: 'nowrap' }} onClick={() => setResetTarget(u)}>
                        Reset PW
                      </button>
                      <button type="button" className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }} onClick={() => toggleActive(u)}>
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        aria-label="Archive"
                        style={{ marginLeft: 'auto' }}
                        onClick={() => setArchiveTarget(u)}
                      >
                        <ArchiveIcon size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ opacity: 0.6, textAlign: 'center', padding: 24 }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen && (
        <DialogShell
          title="Add new user"
          onClose={() => setAddOpen(false)}
          actions={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setAddOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={submitAdd}>
                Add user
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-grid-3">
              <div className="field">
                <label>First name</label>
                <input className="input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div className="field">
                <label>Middle name</label>
                <input className="input" value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} />
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
            <div className="form-grid-2">
              <div className="field">
                <label>Username</label>
                <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </div>
              <div className="field">
                <label>Temporary password</label>
                <input
                  className="input"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label>Role</label>
              <Select
                value={form.role}
                onChange={(v) => setForm({ ...form, role: v })}
                options={[
                  { value: 'coach', label: 'Coach' },
                  { value: 'admin', label: 'Admin' },
                  { value: 'player', label: 'Player' },
                ]}
              />
            </div>
            {(form.role === 'coach' || form.role === 'player') && (
              <div className="field">
                <label>{form.role === 'coach' ? 'Team / sport they coach' : 'Team'}</label>
                <Select
                  value={form.team}
                  onChange={(v) => setForm({ ...form, team: v })}
                  placeholder="No sports set up yet"
                  options={(sports || []).map((s) => ({ value: s.name, label: s.name }))}
                />
                <p style={{ fontSize: 14.5, opacity: 0.6, marginTop: 4 }}>
                  {form.role === 'coach' ? 'This coach will only see and manage players on this team.' : ''} Don't see the right sport? Add
                  it from Settings → Manage Sports.
                </p>
              </div>
            )}
            {form.role === 'player' && (
              <div className="field">
                <label>Year level</label>
                <Select
                  value={form.year_level}
                  onChange={(v) => setForm({ ...form, year_level: v })}
                  placeholder="Not set"
                  options={YEAR_LEVEL_OPTIONS}
                />
              </div>
            )}
          </div>
        </DialogShell>
      )}

      {viewing && (
        <DialogShell
          title={viewing.display_name}
          onClose={() => setViewing(null)}
          actions={
            <button type="button" className="btn btn-secondary" onClick={() => setViewing(null)}>
              Close
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              ['Username', viewing.username],
              ['Email', viewing.email || '—'],
              ['Role', viewing.role],
              ['Team', viewing.team || '—'],
              ['Status', viewing.is_active ? 'Active' : 'Inactive'],
              ['Last login', viewing.last_login ? new Date(viewing.last_login).toLocaleString() : 'Never'],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--color-divider)',
                  fontSize: 15,
                }}
              >
                <span style={{ opacity: 0.6 }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </DialogShell>
      )}

      {resetTarget && (
        <DialogShell
          title={`Reset password — ${resetTarget.display_name}`}
          onClose={() => {
            setResetTarget(null);
            setTempPassword(null);
          }}
          actions={
            tempPassword ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setResetTarget(null);
                  setTempPassword(null);
                }}
              >
                Done
              </button>
            ) : (
              <>
                <button type="button" className="btn btn-secondary" onClick={() => setResetTarget(null)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={submitResetPassword}>
                  Reset to default
                </button>
              </>
            )
          }
        >
          {tempPassword ? (
            <div className="dialog-body">
              Temporary password: <strong style={{ fontFamily: 'monospace' }}>{tempPassword}</strong>
              <p style={{ marginTop: 8, fontSize: 15.5, opacity: 0.7 }}>
                Share this with {resetTarget.display_name}. They should log in and change it from their own profile as soon as possible.
              </p>
            </div>
          ) : (
            <div className="dialog-body">
              This will reset {resetTarget.display_name}'s password to <strong style={{ fontFamily: 'monospace' }}>changeme</strong>,
              invalidating their current one. They'll need to log in and set a new password themselves.
            </div>
          )}
        </DialogShell>
      )}

      {archiveTarget && (
        <ConfirmDialog
          data={{
            title: 'Archive user?',
            body: `Move ${archiveTarget.display_name} to the archive and deactivate their account. This can be undone from the Archive page.`,
            confirmLabel: 'Archive',
            run: () => archiveUser(archiveTarget),
          }}
          onClose={() => setArchiveTarget(null)}
          onConfirm={() => archiveUser(archiveTarget)}
        />
      )}
    </>
  );
}
