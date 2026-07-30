import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { AttendanceRecord, AttendanceStatus, PlayerProfile } from '../../api/domain';
import { DialogShell } from '../../components/modals/DialogShell';

interface AttendancePageProps {
  showToast: (msg: string) => void;
}

function statusTag(status: string) {
  if (status === 'present') return 'tag tag-success';
  if (status === 'late') return 'tag tag-warning';
  return 'tag tag-danger';
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

const today = () => new Date().toISOString().slice(0, 10);

export function AttendancePage({ showToast }: AttendancePageProps) {
  const [players, setPlayers] = useState<PlayerProfile[] | null>(null);
  const [statuses, setStatuses] = useState<Record<number, AttendanceStatus>>({});
  const [date, setDate] = useState(today());
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<AttendanceRecord[] | null>(null);
  const [viewingSession, setViewingSession] = useState<SessionSummary | null>(null);

  async function loadPlayers() {
    const data = await api.get<PlayerProfile[]>('/coach/players');
    setPlayers(data);
    setStatuses(Object.fromEntries(data.map((p) => [p.player_id, 'present' as AttendanceStatus])));
  }

  async function loadHistory() {
    const data = await api.get<AttendanceRecord[]>('/coach/attendance');
    setHistory(data);
  }

  useEffect(() => {
    loadPlayers();
    loadHistory();
  }, []);

  function markAll(status: AttendanceStatus) {
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

  const sessions = history ? groupByDate(history) : null;

  return (
    <>
      <div className="card elev-sm" style={{ padding: 20, marginBottom: 24 }}>
        <div className="card-kicker">Record attendance</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '10px 0 16px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Session date</label>
          <input className="input" style={{ maxWidth: 180 }} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div style={{ flex: 1 }} />
          <button type="button" className="btn btn-secondary" onClick={() => markAll('present')}>Mark all present</button>
          <button type="button" className="btn btn-secondary" onClick={() => markAll('late')}>Mark all late</button>
          <button type="button" className="btn btn-secondary" onClick={() => markAll('absent')}>Mark all absent</button>
        </div>

        {!players ? (
          <div className="card-body">Loading players…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {players.map((p) => (
              <div key={p.player_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-divider)' }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{p.first_name} {p.last_name}</span>
                <div className="seg">
                  {(['present', 'late', 'absent'] as AttendanceStatus[]).map((s) => (
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

      <div className="card-title" style={{ marginBottom: 10 }}>Attendance history</div>
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
            {sessions?.map((s) => (
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
            {sessions && sessions.length === 0 && (
              <tr><td colSpan={7} style={{ opacity: 0.6, textAlign: 'center', padding: 24 }}>No attendance recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {viewingSession && (
        <DialogShell
          title={`Attendance — ${viewingSession.date}`}
          onClose={() => setViewingSession(null)}
          actions={<button type="button" className="btn btn-secondary" onClick={() => setViewingSession(null)}>Close</button>}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {viewingSession.records.map((r) => (
              <div key={r.attendance_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-divider)', fontSize: 13.5 }}>
                <span>{r.player_name}</span>
                <span className={statusTag(r.status)}>{r.status}</span>
              </div>
            ))}
          </div>
        </DialogShell>
      )}
    </>
  );
}
