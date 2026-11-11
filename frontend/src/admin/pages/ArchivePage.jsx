import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Select } from '../../components/Select';
import { RestoreIcon, TrashIcon } from '../../icons';

function recordLabel(record) {
  const data = record.archive_data;
  if (data?.profile) return `${data.profile.first_name ?? ''} ${data.profile.last_name ?? ''}`.trim();
  return `${record.record_type} #${record.record_id}`;
}

function recordRole(record) {
  return record.archive_data?.role ?? record.record_type;
}

function recordTeam(record) {
  const profile = record.archive_data?.profile;
  return profile?.team ?? profile?.specialization ?? '—';
}

export function ArchivePage({ showToast }) {
  const [records, setRecords] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');

  async function load() {
    const data = await api.get('/admin/archive');
    setRecords(data);
  }

  useEffect(() => {
    load();
  }, []);

  const roles = Array.from(new Set((records || []).map((r) => recordRole(r)))).sort();
  const teams = Array.from(new Set((records || []).map((r) => recordTeam(r)).filter((t) => t !== '—'))).sort();

  const filtered = (records || []).filter(
    (r) =>
      (roleFilter === 'all' || recordRole(r) === roleFilter) &&
      (teamFilter === 'all' || recordTeam(r) === teamFilter) &&
      recordLabel(r).toLowerCase().includes(search.toLowerCase()),
  );

  async function restore(r) {
    await api.post(`/admin/archive/${r.archive_id}/restore`);
    showToast(`${recordLabel(r)} restored`);
    load();
  }

  async function deleteForever(r) {
    await api.delete(`/admin/archive/${r.archive_id}`);
    showToast(`${recordLabel(r)} permanently deleted`);
    load();
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          className="input"
          style={{ maxWidth: 280 }}
          placeholder="Search archived records"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          style={{ maxWidth: 170 }}
          value={roleFilter}
          onChange={(v) => setRoleFilter(v)}
          options={[
            { value: 'all', label: 'All roles' },
            ...roles.map((r) => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) })),
          ]}
        />
        <Select
          style={{ maxWidth: 190 }}
          value={teamFilter}
          onChange={(v) => setTeamFilter(v)}
          options={[{ value: 'all', label: 'All teams' }, ...teams.map((t) => ({ value: t, label: t }))]}
        />
      </div>
      <div className="card elev-sm" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Record</th>
                <th>Role</th>
                <th>Team</th>
                <th>Archived on</th>
                <th>Archived by</th>
                <th style={{ width: 150 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.archive_id}>
                  <td style={{ fontWeight: 600 }}>{recordLabel(r)}</td>
                  <td>
                    <span className="tag tag-neutral" style={{ textTransform: 'capitalize' }}>
                      {recordRole(r)}
                    </span>
                  </td>
                  <td style={{ opacity: 0.75 }}>{recordTeam(r)}</td>
                  <td style={{ opacity: 0.65 }}>{new Date(r.archived_at).toLocaleString()}</td>
                  <td style={{ opacity: 0.65 }}>{r.archived_by_name}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" className="btn btn-secondary" onClick={() => restore(r)}>
                        <RestoreIcon />
                        Restore
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        aria-label="Delete permanently"
                        onClick={() => deleteForever(r)}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ opacity: 0.6, textAlign: 'center', padding: 24 }}>
                    No archived records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
