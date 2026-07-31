import { useEffect, useState } from 'react';
import { api } from '../../api/client';

function statusTag(status) {
  if (status === 'joined') return 'tag tag-success';
  if (status === 'excused') return 'tag tag-warning';
  return 'tag tag-danger';
}

export function ParticipationPage() {
  const [records, setRecords] = useState(null);

  useEffect(() => {
    api.get('/player/participation').then(setRecords);
  }, []);

  if (!records) return <div className="card-body">Loading participation history…</div>;

  return (
    <div className="card elev-sm" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Activity</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.participation_id}>
                <td style={{ fontWeight: 600 }}>{r.activity_name}</td>
                <td style={{ opacity: 0.75 }}>{r.activity_date}</td>
                <td>
                  <span className={statusTag(r.participation_status)}>{r.participation_status.replace('_', ' ')}</span>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={3} style={{ opacity: 0.6, textAlign: 'center', padding: 24 }}>
                  No participation history yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
