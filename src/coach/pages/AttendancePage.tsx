import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { AttendanceRecord, AttendanceStatus, PlayerProfile } from '../../api/domain';

interface AttendancePageProps {
  showToast: (msg: string) => void;
}

function statusTag(status: string) {
  if (status === 'present') return 'tag tag-accent';
  if (status === 'late') return 'tag tag-outline';
  return 'tag tag-neutral';
}

const today = () => new Date().toISOString().slice(0, 10);

export function AttendancePage({ showToast }: AttendancePageProps) {
  const [players, setPlayers] = useState<PlayerProfile[] | null>(null);
  const [statuses, setStatuses] = useState<Record<number, AttendanceStatus>>({});
  const [date, setDate] = useState(today());
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<AttendanceRecord[] | null>(null);

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

  async function submit() {
    if (!players) return;
    setSubmitting(true);
    try {
      await api.post('/coach/attendance', {
        date,
        records: players.map((p) => ({ player_id: p.player_id, status: statuses[p.player_id] })),
      });
      showToast(`Attendance recorded for ${date}`);
      loadHistory();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="card elev-sm" style={{ padding: 20, marginBottom: 24 }}>
        <div className="card-kicker">Record attendance</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '10px 0 16px' }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Session date</label>
          <input className="input" style={{ maxWidth: 180 }} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
          {submitting ? 'Saving…' : 'Save attendance'}
        </button>
      </div>

      <div className="card-title" style={{ marginBottom: 10 }}>Attendance history</div>
      <div className="card elev-sm" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Player</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history?.map((r) => (
              <tr key={r.attendance_id}>
                <td>{r.date}</td>
                <td style={{ fontWeight: 600 }}>{r.player_name}</td>
                <td><span className={statusTag(r.status)}>{r.status}</span></td>
              </tr>
            ))}
            {history && history.length === 0 && (
              <tr><td colSpan={3} style={{ opacity: 0.6, textAlign: 'center', padding: 24 }}>No attendance recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
