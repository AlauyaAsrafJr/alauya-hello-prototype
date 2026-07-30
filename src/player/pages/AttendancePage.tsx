import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { AttendanceRecord } from '../../api/domain';

function statusTag(status: string) {
  if (status === 'present') return 'tag tag-accent';
  if (status === 'late') return 'tag tag-outline';
  return 'tag tag-neutral';
}

export function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[] | null>(null);

  useEffect(() => {
    api.get<AttendanceRecord[]>('/player/attendance').then(setRecords);
  }, []);

  if (!records) return <div className="card-body">Loading attendance…</div>;

  return (
    <div className="card elev-sm" style={{ padding: 0, overflow: 'hidden' }}>
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Recorded by</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.attendance_id}>
              <td>{r.date}</td>
              <td style={{ opacity: 0.75 }}>{r.coach_name}</td>
              <td><span className={statusTag(r.status)}>{r.status}</span></td>
            </tr>
          ))}
          {records.length === 0 && (
            <tr>
              <td colSpan={3} style={{ opacity: 0.6, textAlign: 'center', padding: 24 }}>No attendance records yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
