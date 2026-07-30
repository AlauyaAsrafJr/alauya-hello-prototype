import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { AttendanceRecord } from '../../api/domain';

function statusTag(status: string) {
  if (status === 'present') return 'tag tag-accent';
  if (status === 'late') return 'tag tag-outline';
  return 'tag tag-neutral';
}

function isWithinLastWeek(dateStr: string) {
  const date = new Date(dateStr);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return date >= weekAgo;
}

export function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[] | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | 'week'>('all');

  useEffect(() => {
    api.get<AttendanceRecord[]>('/admin/attendance').then(setRecords);
  }, []);

  const filtered = (records || []).filter((r) => dateFilter === 'all' || isWithinLastWeek(r.date));
  const total = filtered.length;
  const present = filtered.filter((r) => r.status === 'present').length;
  const rate = total ? Math.round((present / total) * 100) : 0;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div className="seg">
          <label className="seg-opt">
            <input type="radio" checked={dateFilter === 'all'} onChange={() => setDateFilter('all')} />
            All dates
          </label>
          <label className="seg-opt">
            <input type="radio" checked={dateFilter === 'week'} onChange={() => setDateFilter('week')} />
            This week
          </label>
        </div>
        <div style={{ flex: 1 }} />
        <span className="tag tag-outline">{total} records · {rate}% present</span>
      </div>

      <div className="card elev-sm" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Player</th>
              <th>Recorded by</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.attendance_id}>
                <td>{r.date}</td>
                <td style={{ fontWeight: 600 }}>{r.player_name}</td>
                <td style={{ opacity: 0.75 }}>{r.coach_name}</td>
                <td><span className={statusTag(r.status)}>{r.status}</span></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} style={{ opacity: 0.6, textAlign: 'center', padding: 24 }}>No attendance records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
