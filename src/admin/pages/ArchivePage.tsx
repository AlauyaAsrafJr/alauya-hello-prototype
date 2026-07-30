import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { ArchivedRecord } from '../../api/domain';
import { RestoreIcon, TrashIcon } from '../../icons';

interface ArchivePageProps {
  showToast: (msg: string) => void;
}

function recordLabel(record: ArchivedRecord) {
  const data = record.archive_data as { display_name?: string; profile?: { first_name?: string; last_name?: string } };
  if (data?.profile) return `${data.profile.first_name ?? ''} ${data.profile.last_name ?? ''}`.trim();
  return `${record.record_type} #${record.record_id}`;
}

export function ArchivePage({ showToast }: ArchivePageProps) {
  const [records, setRecords] = useState<ArchivedRecord[] | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');

  async function load() {
    const data = await api.get<ArchivedRecord[]>('/admin/archive');
    setRecords(data);
  }

  useEffect(() => {
    load();
  }, []);

  const types = Array.from(new Set((records || []).map((r) => r.record_type)));
  const filtered = (records || []).filter((r) => typeFilter === 'all' || r.record_type === typeFilter);

  async function restore(r: ArchivedRecord) {
    await api.post(`/admin/archive/${r.archive_id}/restore`);
    showToast(`${recordLabel(r)} restored`);
    load();
  }

  async function deleteForever(r: ArchivedRecord) {
    await api.delete(`/admin/archive/${r.archive_id}`);
    showToast(`${recordLabel(r)} permanently deleted`);
    load();
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div className="seg">
          <label className="seg-opt"><input type="radio" checked={typeFilter === 'all'} onChange={() => setTypeFilter('all')} />All</label>
          {types.map((t) => (
            <label key={t} className="seg-opt" style={{ textTransform: 'capitalize' }}>
              <input type="radio" checked={typeFilter === t} onChange={() => setTypeFilter(t)} />
              {t}s
            </label>
          ))}
        </div>
      </div>
      <div className="card elev-sm" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Record</th>
              <th>Type</th>
              <th>Archived on</th>
              <th>Archived by</th>
              <th style={{ width: 150 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.archive_id}>
                <td style={{ fontWeight: 600 }}>{recordLabel(r)}</td>
                <td><span className="tag tag-neutral" style={{ textTransform: 'capitalize' }}>{r.record_type}</span></td>
                <td style={{ opacity: 0.65 }}>{new Date(r.archived_at).toLocaleString()}</td>
                <td style={{ opacity: 0.65 }}>{r.archived_by_name}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="btn btn-secondary" onClick={() => restore(r)}>
                      <RestoreIcon />
                      Restore
                    </button>
                    <button type="button" className="btn btn-ghost btn-icon" aria-label="Delete permanently" onClick={() => deleteForever(r)}>
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} style={{ opacity: 0.6, textAlign: 'center', padding: 24 }}>No archived records.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
