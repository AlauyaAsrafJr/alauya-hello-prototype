import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { AttendanceRecord } from '../../api/domain';
import { DialogShell } from '../../components/modals/DialogShell';

function statusTag(status: string) {
  if (status === 'present') return 'tag tag-success';
  if (status === 'late') return 'tag tag-warning';
  return 'tag tag-danger';
}

function isWithinLastWeek(dateStr: string) {
  const date = new Date(dateStr);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return date >= weekAgo;
}

interface SessionSummary {
  date: string;
  total: number;
  present: number;
  late: number;
  absent: number;
  records: AttendanceRecord[];
}

function groupByDate(records: AttendanceRecord[]): SessionSummary[] {
  const byDate = new Map<string, AttendanceRecord[]>();
  for (const r of records) {
    if (!byDate.has(r.date)) byDate.set(r.date, []);
    byDate.get(r.date)!.push(r);
  }
  return Array.from(byDate.entries())
    .map(([date, recs]) => ({
      date,
      total: recs.length,
      present: recs.filter((r) => r.status === 'present').length,
      late: recs.filter((r) => r.status === 'late').length,
      absent: recs.filter((r) => r.status === 'absent').length,
      records: recs,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

interface PlayerSummary {
  player_id: number;
  player_name: string;
  total: number;
  present: number;
  late: number;
  absent: number;
}

function groupByPlayer(records: AttendanceRecord[]): PlayerSummary[] {
  const byPlayer = new Map<number, AttendanceRecord[]>();
  for (const r of records) {
    if (!byPlayer.has(r.player_id)) byPlayer.set(r.player_id, []);
    byPlayer.get(r.player_id)!.push(r);
  }
  return Array.from(byPlayer.entries())
    .map(([player_id, recs]) => ({
      player_id,
      player_name: recs[0]?.player_name || '—',
      total: recs.length,
      present: recs.filter((r) => r.status === 'present').length,
      late: recs.filter((r) => r.status === 'late').length,
      absent: recs.filter((r) => r.status === 'absent').length,
    }))
    .sort((a, b) => a.player_name.localeCompare(b.player_name));
}

export function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[] | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | 'week'>('all');
  const [viewingSession, setViewingSession] = useState<SessionSummary | null>(null);
  const [viewMode, setViewMode] = useState<'session' | 'player'>('session');

  useEffect(() => {
    api.get<AttendanceRecord[]>('/admin/attendance').then(setRecords);
  }, []);

  const filtered = (records || []).filter((r) => dateFilter === 'all' || isWithinLastWeek(r.date));
  const total = filtered.length;
  const present = filtered.filter((r) => r.status === 'present').length;
  const rate = total ? Math.round((present / total) * 100) : 0;
  const sessions = groupByDate(filtered);
  const playerSummaries = groupByPlayer(filtered);

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
        <span className="tag tag-info">{total} records · {rate}% present</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <div className="seg">
          <label className="seg-opt">
            <input type="radio" checked={viewMode === 'session'} onChange={() => setViewMode('session')} />
            By session
          </label>
          <label className="seg-opt">
            <input type="radio" checked={viewMode === 'player'} onChange={() => setViewMode('player')} />
            By player
          </label>
        </div>
      </div>

      {viewMode === 'session' ? (
        <div className="card elev-sm" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Present</th>
                <th>Late</th>
                <th>Absent</th>
                <th>Total</th>
                <th>Rate</th>
                <th style={{ width: 90 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.date}>
                  <td style={{ fontWeight: 600 }}>{s.date}</td>
                  <td><span className="tag tag-success">{s.present}</span></td>
                  <td><span className="tag tag-warning">{s.late}</span></td>
                  <td><span className="tag tag-danger">{s.absent}</span></td>
                  <td style={{ opacity: 0.75 }}>{s.total}</td>
                  <td style={{ opacity: 0.75 }}>{Math.round(((s.present + s.late) / s.total) * 100)}%</td>
                  <td>
                    <button type="button" className="btn btn-secondary" onClick={() => setViewingSession(s)}>View</button>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr><td colSpan={7} style={{ opacity: 0.6, textAlign: 'center', padding: 24 }}>No attendance records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card elev-sm" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Present</th>
                <th>Late</th>
                <th>Absent</th>
                <th>Total sessions</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {playerSummaries.map((p) => (
                <tr key={p.player_id}>
                  <td style={{ fontWeight: 600 }}>{p.player_name}</td>
                  <td><span className="tag tag-success">{p.present}</span></td>
                  <td><span className="tag tag-warning">{p.late}</span></td>
                  <td><span className="tag tag-danger">{p.absent}</span></td>
                  <td style={{ opacity: 0.75 }}>{p.total}</td>
                  <td style={{ opacity: 0.75 }}>{p.total ? Math.round(((p.present + p.late) / p.total) * 100) : 0}%</td>
                </tr>
              ))}
              {playerSummaries.length === 0 && (
                <tr><td colSpan={6} style={{ opacity: 0.6, textAlign: 'center', padding: 24 }}>No attendance records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewingSession && (
        <DialogShell
          title={`Attendance — ${viewingSession.date}`}
          onClose={() => setViewingSession(null)}
          actions={<button type="button" className="btn btn-secondary" onClick={() => setViewingSession(null)}>Close</button>}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {viewingSession.records.map((r) => (
              <div key={r.attendance_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-divider)', fontSize: 13.5 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{r.player_name}</div>
                  <div style={{ fontSize: 11.5, opacity: 0.55 }}>Recorded by {r.coach_name}</div>
                </div>
                <span className={statusTag(r.status)}>{r.status}</span>
              </div>
            ))}
          </div>
        </DialogShell>
      )}
    </>
  );
}
