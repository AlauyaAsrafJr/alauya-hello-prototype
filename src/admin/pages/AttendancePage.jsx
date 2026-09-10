import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { DialogShell } from '../../components/modals/DialogShell';
import { Select } from '../../components/Select';

function statusTag(status) {
  if (status === 'present') return 'tag tag-success';
  if (status === 'late') return 'tag tag-warning';
  return 'tag tag-danger';
}

function isWithinLastWeek(dateStr) {
  const date = new Date(dateStr);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return date >= weekAgo;
}

function groupBySession(records) {
  const byKey = new Map();
  for (const r of records) {
    const key = `${r.date}__${r.team || '—'}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(r);
  }
  return Array.from(byKey.values())
    .map((recs) => ({
      date: recs[0].date,
      team: recs[0].team || '—',
      total: recs.length,
      present: recs.filter((r) => r.status === 'present').length,
      late: recs.filter((r) => r.status === 'late').length,
      absent: recs.filter((r) => r.status === 'absent').length,
      records: recs,
    }))
    .sort((a, b) => b.date.localeCompare(a.date) || a.team.localeCompare(b.team));
}

function groupByPlayer(records) {
  const byPlayer = new Map();
  for (const r of records) {
    if (!byPlayer.has(r.player_id)) byPlayer.set(r.player_id, []);
    byPlayer.get(r.player_id).push(r);
  }
  return Array.from(byPlayer.entries())
    .map(([player_id, recs]) => ({
      player_id,
      player_name: recs[0]?.player_name || '—',
      team: recs[0]?.team || '—',
      total: recs.length,
      present: recs.filter((r) => r.status === 'present').length,
      late: recs.filter((r) => r.status === 'late').length,
      absent: recs.filter((r) => r.status === 'absent').length,
    }))
    .sort((a, b) => a.player_name.localeCompare(b.player_name));
}

export function AttendancePage() {
  const [records, setRecords] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [customDate, setCustomDate] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [viewingSession, setViewingSession] = useState(null);
  const [viewMode, setViewMode] = useState('session');

  useEffect(() => {
    api.get('/admin/attendance').then(setRecords);
  }, []);

  const teams = Array.from(new Set((records || []).map((r) => r.team).filter((t) => !!t))).sort();

  const filtered = (records || []).filter(
    (r) =>
      (dateFilter === 'all' ||
        (dateFilter === 'week' && isWithinLastWeek(r.date)) ||
        (dateFilter === 'custom' && r.date === customDate)) &&
      (teamFilter === 'all' || r.team === teamFilter),
  );
  const total = filtered.length;
  const present = filtered.filter((r) => r.status === 'present').length;
  const rate = total ? Math.round((present / total) * 100) : 0;
  const sessions = groupBySession(filtered);
  const playerSummaries = groupByPlayer(filtered);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="seg">
          <label className="seg-opt">
            <input
              type="radio"
              checked={dateFilter === 'all'}
              onChange={() => {
                setDateFilter('all');
                setCustomDate('');
              }}
            />
            All dates
          </label>
          <label className="seg-opt">
            <input
              type="radio"
              checked={dateFilter === 'week'}
              onChange={() => {
                setDateFilter('week');
                setCustomDate('');
              }}
            />
            This week
          </label>
        </div>
        <input
          type="date"
          className="input"
          style={{ maxWidth: 170 }}
          value={customDate}
          onChange={(e) => {
            setCustomDate(e.target.value);
            setDateFilter(e.target.value ? 'custom' : 'all');
          }}
        />
        <Select
          style={{ minWidth: 200 }}
          value={teamFilter}
          onChange={setTeamFilter}
          options={[{ value: 'all', label: 'All sports/teams' }, ...teams.map((t) => ({ value: t, label: t }))]}
        />
        <div style={{ flex: 1 }} />
        <span className="tag tag-info">
          {total} records · {rate}% present
        </span>
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
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Team</th>
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
                  <tr key={`${s.date}__${s.team}`}>
                    <td style={{ fontWeight: 600 }}>{s.date}</td>
                    <td>
                      <span className="tag tag-neutral">{s.team}</span>
                    </td>
                    <td>
                      <span className="tag tag-success">{s.present}</span>
                    </td>
                    <td>
                      <span className="tag tag-warning">{s.late}</span>
                    </td>
                    <td>
                      <span className="tag tag-danger">{s.absent}</span>
                    </td>
                    <td style={{ opacity: 0.75 }}>{s.total}</td>
                    <td style={{ opacity: 0.75 }}>{Math.round(((s.present + s.late) / s.total) * 100)}%</td>
                    <td>
                      <button type="button" className="btn btn-secondary" onClick={() => setViewingSession(s)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ opacity: 0.6, textAlign: 'center', padding: 24 }}>
                      No attendance records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card elev-sm" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Team</th>
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
                    <td style={{ opacity: 0.75 }}>{p.team}</td>
                    <td>
                      <span className="tag tag-success">{p.present}</span>
                    </td>
                    <td>
                      <span className="tag tag-warning">{p.late}</span>
                    </td>
                    <td>
                      <span className="tag tag-danger">{p.absent}</span>
                    </td>
                    <td style={{ opacity: 0.75 }}>{p.total}</td>
                    <td style={{ opacity: 0.75 }}>{p.total ? Math.round(((p.present + p.late) / p.total) * 100) : 0}%</td>
                  </tr>
                ))}
                {playerSummaries.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ opacity: 0.6, textAlign: 'center', padding: 24 }}>
                      No attendance records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewingSession && (
        <DialogShell
          title={`Attendance — ${viewingSession.team} · ${viewingSession.date}`}
          onClose={() => setViewingSession(null)}
          actions={
            <button type="button" className="btn btn-secondary" onClick={() => setViewingSession(null)}>
              Close
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {viewingSession.records.map((r) => (
              <div
                key={r.attendance_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--color-divider)',
                  fontSize: 15,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{r.player_name}</div>
                  <div style={{ fontSize: 14.5, opacity: 0.55 }}>Recorded by {r.coach_name}</div>
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
