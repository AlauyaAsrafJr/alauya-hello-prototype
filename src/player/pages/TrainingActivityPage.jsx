import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export function TrainingActivityPage() {
  const [activities, setActivities] = useState(null);

  useEffect(() => {
    api.get('/player/training-activities').then(setActivities);
  }, []);

  if (!activities) return <div className="card-body">Loading training activities…</div>;

  return (
    <div className="card elev-sm" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Activity</th>
              <th>Type</th>
              <th>Date</th>
              <th>Duration</th>
              <th>Coach</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a) => (
              <tr key={a.activity_id}>
                <td style={{ fontWeight: 600 }}>{a.activity_name}</td>
                <td>
                  {a.activity_type ? <span className="tag tag-info">{a.activity_type}</span> : <span style={{ opacity: 0.5 }}>—</span>}
                </td>
                <td style={{ opacity: 0.75 }}>{a.activity_date}</td>
                <td style={{ opacity: 0.75 }}>{a.duration ? `${a.duration} min` : '—'}</td>
                <td style={{ opacity: 0.75 }}>{a.coach_name}</td>
                <td style={{ opacity: 0.65, maxWidth: 260 }}>{a.notes || '—'}</td>
              </tr>
            ))}
            {activities.length === 0 && (
              <tr>
                <td colSpan={6} style={{ opacity: 0.6, textAlign: 'center', padding: 24 }}>
                  No training activities logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
