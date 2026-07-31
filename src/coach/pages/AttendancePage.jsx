import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { DialogShell } from '../../components/modals/DialogShell';

function statusTag(status) {
  if (status === 'present') return 'tag tag-success';
  if (status === 'late') return 'tag tag-warning';
  return 'tag tag-danger';
}

function groupByDate(records) {
  const byDate = new Map();
  for (const r of records) {
    if (!byDate.has(r.date)) byDate.set(r.date, []);
    byDate.get(r.date).push(r);
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
      total: recs.length,
      present: recs.filter((r) => r.status === 'present').length,
      late: recs.filter((r) => r.status === 'late').length,
      absent: recs.filter((r) => r.status === 'absent').length,
    }))
    .sort((a, b) => a.player_name.localeCompare(b.player_name));
}

const today = () => new Date().toISOString().slice(0, 10);

export function AttendancePage({ showToast }) {
  const [players, setPlayers] = useState(null);
  const [statuses, setStatuses] = useState({});
  const [date, setDate] = useState(today());
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState(null);
  const [viewingSession, setViewingSession] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [editStatuses, setEditStatuses] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [viewMode, setViewMode] = useState('session');

  async function loadPlayers() {
    const data = await api.get('/coach/players');
    setPlayers(data);
    setStatuses(Object.fromEntries(data.map((p) => [p.player_id, 'present'])));
  }

  async function loadHistory() {
    const data = await api.get('/coach/attendance');
    setHistory(data);
  }

  useEffect(() => {
    loadPlayers();
    loadHistory();
  }, []);

  function markAll(status) {
    if (!players) return;
    setStatuses(Object.fromEntries(players.map((p) => [p.player_id, status])));
  }

  async function submit() {
    if (!players) return;
    setSubmitting(true);
    try {
      await api.post('/coach/attendance', {
        date,
        records: players.map((p) => ({ player_id: p.player_id, status: statuses[p.player_id] })),
      });
      showToast(`Attendance recorded for the whole team on ${date}`);
      loadHistory();
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(session) {
    setEditingSession(session);
    setEditStatuses(Object.fromEntries(session.records.map((r) => [r.attendance_id, r.status])));
  }

  async function saveEdit() {
    if (!editingSession) return;
    setSavingEdit(true);
    try {
      const changed = editingSession.records.filter((r) => editStatuses[r.attendance_id] !== r.status);
      await Promise.all(changed.map((r) => api.patch(`/coach/attendance/${r.attendance_id}`, { status: editStatuses[r.attendance_id] })));
      showToast(`Attendance for ${editingSession.date} updated`);
      setEditingSession(null);
      loadHistory();
    } finally {
      setSavingEdit(false);
    }
  }

  const sessions = history ? groupByDate(history) : null;
  const playerSummaries = history ? groupByPlayer(history) : null;

  return (
    <>
      <div className="card elev-sm" style={{ padding: 20, marginBottom: 24 }}>
        <div className="card-kicker">Record attendance</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '10px 0 16px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Session date</label>
          <input className="input" style={{ maxWidth: 180 }} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div style={{ flex: 1 }} />
          <button type="button" className="btn btn-secondary" onClick={() => markAll('present')}>
            Mark all present
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => markAll('late')}>
            Mark all late
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => markAll('absent')}>
            Mark all absent
          </button>
        </div>

        {!players ? (
          <div className="card-body">Loading players…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {players.map((p) => (
              <div
                key={p.player_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--color-divider)',
                }}
              >
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>
                  {p.first_name} {p.last_name}
                </span>
                <div className="seg">
                  {['present', 'late', 'absent'].map((s) => (
                    <label key={s} className="seg-opt">
                      <input
                        type="radio"
                        checked={statuses[p.player_id] === s}
                        onChange={() => setStatuses((prev) => ({ ...prev, [p.player_id]: s }))}
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={submit} disabled={submitting || !players}>
          {submitting ? 'Saving…' : `Save attendance for all ${players?.length ?? 0} players`}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 12 }}>
        <div className="card-title">Attendance history</div>
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
                <th style={{ width: 150 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions?.map((s) => (
                <tr key={s.date}>
                  <td style={{ fontWeight: 600 }}>{s.date}</td>
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
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setViewingSession(s)}>
                        View
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={() => openEdit(s)}>
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sessions && sessions.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ opacity: 0.6, textAlign: 'center', padding: 24 }}>
                    No attendance recorded yet.
                  </td>
                </tr>
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
              {playerSummaries?.map((p) => (
                <tr key={p.player_id}>
                  <td style={{ fontWeight: 600 }}>{p.player_name}</td>
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
              {playerSummaries && playerSummaries.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ opacity: 0.6, textAlign: 'center', padding: 24 }}>
                    No attendance recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewingSession && (
        <DialogShell
          title={`Attendance — ${viewingSession.date}`}
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
                  fontSize: 13.5,
                }}
              >
                <span>{r.player_name}</span>
                <span className={statusTag(r.status)}>{r.status}</span>
              </div>
            ))}
          </div>
        </DialogShell>
      )}

      {editingSession && (
        <DialogShell
          title={`Edit attendance — ${editingSession.date}`}
          onClose={() => setEditingSession(null)}
          actions={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setEditingSession(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={saveEdit} disabled={savingEdit}>
                {savingEdit ? 'Saving…' : 'Save changes'}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {editingSession.records.map((r) => (
              <div
                key={r.attendance_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--color-divider)',
                }}
              >
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{r.player_name}</span>
                <div className="seg">
                  {['present', 'late', 'absent'].map((s) => (
                    <label key={s} className="seg-opt">
                      <input
                        type="radio"
                        checked={editStatuses[r.attendance_id] === s}
                        onChange={() => setEditStatuses((prev) => ({ ...prev, [r.attendance_id]: s }))}
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogShell>
      )}
    </>
  );
}
