import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { StatCard } from '../../components/StatCard';
import { AttendanceIcon } from '../../icons';

function statusTag(status) {
  if (status === 'present') return 'tag tag-success';
  if (status === 'late') return 'tag tag-warning';
  return 'tag tag-danger';
}

export function AttendancePage() {
  const [records, setRecords] = useState(null);

  useEffect(() => {
    api.get('/player/attendance').then(setRecords);
  }, []);

  if (!records) return <div className="card-body">Loading attendance…</div>;

  const present = records.filter((r) => r.status === 'present').length;
  const late = records.filter((r) => r.status === 'late').length;
  const absent = records.filter((r) => r.status === 'absent').length;

  return (
    <>
      <div className="stat-grid-3" style={{ marginBottom: 24, maxWidth: 640 }}>
        <StatCard label="Present" value={present} icon={AttendanceIcon} variant="success" />
        <StatCard label="Late" value={late} icon={AttendanceIcon} variant="warning" />
        <StatCard label="Absent" value={absent} icon={AttendanceIcon} variant="danger" />
      </div>

      <div className="card elev-sm" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
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
                  <td>
                    <span className={statusTag(r.status)}>{r.status}</span>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ opacity: 0.6, textAlign: 'center', padding: 24 }}>
                    No attendance records yet.
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
