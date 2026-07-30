import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { ParticipationRecord, PlayerProfile, TrainingActivity } from '../../api/domain';
import { DialogShell } from '../../components/modals/DialogShell';
import { PlusIcon } from '../../icons';

interface TrainingActivitiesPageProps {
  showToast: (msg: string) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export function TrainingActivitiesPage({ showToast }: TrainingActivitiesPageProps) {
  const [activities, setActivities] = useState<TrainingActivity[] | null>(null);
  const [players, setPlayers] = useState<PlayerProfile[] | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingActivity | null>(null);
  const [viewing, setViewing] = useState<{ activity: TrainingActivity; participants: ParticipationRecord[] } | null>(null);

  const [name, setName] = useState('');
  const [date, setDate] = useState(today());
  const [duration, setDuration] = useState('120');
  const [notes, setNotes] = useState('');
  const [participantIds, setParticipantIds] = useState<number[]>([]);

  async function loadActivities() {
    const data = await api.get<TrainingActivity[]>('/coach/training-activities');
    setActivities(data);
  }

  useEffect(() => {
    loadActivities();
    api.get<PlayerProfile[]>('/coach/players').then(setPlayers);
  }, []);

  function resetForm() {
    setName('');
    setDate(today());
    setDuration('120');
    setNotes('');
    setParticipantIds([]);
  }

  async function submitLog() {
    await api.post('/coach/training-activities', {
      activity_name: name,
      activity_date: date,
      duration: Number(duration) || null,
      notes,
      participant_ids: participantIds,
    });
    setLogOpen(false);
    resetForm();
    showToast(`"${name}" logged`);
    loadActivities();
  }

  function openEdit(a: TrainingActivity) {
    setEditing(a);
    setName(a.activity_name);
    setDate(a.activity_date);
    setDuration(String(a.duration ?? ''));
    setNotes(a.notes || '');
  }

  async function submitEdit() {
    if (!editing) return;
    await api.patch(`/coach/training-activities/${editing.activity_id}`, {
      activity_name: name,
      activity_date: date,
      duration: Number(duration) || null,
      notes,
    });
    setEditing(null);
    showToast(`"${name}" updated`);
    loadActivities();
  }

  async function openView(a: TrainingActivity) {
    const participants = await api.get<ParticipationRecord[]>(`/coach/training-activities/${a.activity_id}/participation`);
    setViewing({ activity: a, participants });
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setLogOpen(true);
          }}
        >
          <PlusIcon />
          Log training activity
        </button>
      </div>

      <div className="card elev-sm" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Activity</th>
              <th>Date</th>
              <th>Duration</th>
              <th>Notes</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {activities?.map((a) => (
              <tr key={a.activity_id}>
                <td style={{ fontWeight: 600 }}>{a.activity_name}</td>
                <td style={{ opacity: 0.75 }}>{a.activity_date}</td>
                <td style={{ opacity: 0.75 }}>{a.duration ? `${a.duration} min` : '—'}</td>
                <td style={{ opacity: 0.65, maxWidth: 220 }}>{a.notes || '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="btn btn-secondary" onClick={() => openView(a)}>Participants</button>
                    <button type="button" className="btn btn-ghost" onClick={() => openEdit(a)}>Edit</button>
                  </div>
                </td>
              </tr>
            ))}
            {activities && activities.length === 0 && (
              <tr><td colSpan={5} style={{ opacity: 0.6, textAlign: 'center', padding: 24 }}>No training activities logged yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {logOpen && (
        <DialogShell
          title="Log training activity"
          onClose={() => setLogOpen(false)}
          actions={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setLogOpen(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={submitLog} disabled={!name.trim()}>Log activity</button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="field">
              <label>Activity name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label>Date</label>
                <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="field">
                <label>Duration (minutes)</label>
                <input className="input" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea className="input" style={{ minHeight: 70 }} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="field">
              <label>Participants</label>
              <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--color-divider)', padding: 8 }}>
                {players?.map((p) => (
                  <label key={p.player_id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '4px 0' }}>
                    <input
                      type="checkbox"
                      checked={participantIds.includes(p.player_id)}
                      onChange={(e) =>
                        setParticipantIds((prev) =>
                          e.target.checked ? [...prev, p.player_id] : prev.filter((id) => id !== p.player_id),
                        )
                      }
                    />
                    {p.first_name} {p.last_name}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </DialogShell>
      )}

      {editing && (
        <DialogShell
          title={`Edit ${editing.activity_name}`}
          onClose={() => setEditing(null)}
          actions={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={submitEdit}>Save changes</button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="field">
              <label>Activity name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label>Date</label>
                <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="field">
                <label>Duration (minutes)</label>
                <input className="input" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea className="input" style={{ minHeight: 70 }} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        </DialogShell>
      )}

      {viewing && (
        <DialogShell
          title={`Participants — ${viewing.activity.activity_name}`}
          onClose={() => setViewing(null)}
          actions={<button type="button" className="btn btn-secondary" onClick={() => setViewing(null)}>Close</button>}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {viewing.participants.map((p) => (
              <div key={p.participation_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-divider)', fontSize: 13.5 }}>
                <span>{p.player_name}</span>
                <span className="tag tag-neutral">{p.participation_status}</span>
              </div>
            ))}
            {viewing.participants.length === 0 && <div style={{ opacity: 0.6, fontSize: 13.5 }}>No participants recorded.</div>}
          </div>
        </DialogShell>
      )}
    </>
  );
}
