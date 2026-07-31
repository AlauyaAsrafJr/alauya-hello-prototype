import { useEffect, useState } from 'react';
import { api, ApiError } from '../../api/client';
import type { ActivityType, ParticipationRecord, PlayerProfile, TrainingActivity } from '../../api/domain';
import { DialogShell } from '../../components/modals/DialogShell';
import { Select } from '../../components/Select';
import { PencilIcon, PlusIcon, TrashIcon } from '../../icons';

interface TrainingActivitiesPageProps {
  showToast: (msg: string) => void;
}

function participationTag(status: string) {
  if (status === 'joined') return 'tag tag-success';
  if (status === 'excused') return 'tag tag-warning';
  return 'tag tag-danger';
}

const today = () => new Date().toISOString().slice(0, 10);

export function TrainingActivitiesPage({ showToast }: TrainingActivitiesPageProps) {
  const [activities, setActivities] = useState<TrainingActivity[] | null>(null);
  const [players, setPlayers] = useState<PlayerProfile[] | null>(null);
  const [activityTypes, setActivityTypes] = useState<ActivityType[] | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingActivity | null>(null);
  const [viewing, setViewing] = useState<{ activity: TrainingActivity; participants: ParticipationRecord[] } | null>(null);

  const [name, setName] = useState('');
  const [date, setDate] = useState(today());
  const [duration, setDuration] = useState('120');
  const [notes, setNotes] = useState('');
  const [activityType, setActivityType] = useState('');
  const [participantIds, setParticipantIds] = useState<number[]>([]);

  const [addingType, setAddingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [creatingType, setCreatingType] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
  const [editingTypeName, setEditingTypeName] = useState('');
  const [savingType, setSavingType] = useState(false);

  async function loadActivities() {
    const data = await api.get<TrainingActivity[]>('/coach/training-activities');
    setActivities(data);
  }

  async function loadActivityTypes() {
    const data = await api.get<ActivityType[]>('/coach/activity-types');
    setActivityTypes(data);
  }

  useEffect(() => {
    loadActivities();
    loadActivityTypes();
    api.get<PlayerProfile[]>('/coach/players').then(setPlayers);
  }, []);

  function resetForm() {
    setName('');
    setDate(today());
    setDuration('120');
    setNotes('');
    setActivityType('');
    setParticipantIds([]);
    setAddingType(false);
    setNewTypeName('');
    setEditingTypeId(null);
    setEditingTypeName('');
  }

  async function submitLog() {
    await api.post('/coach/training-activities', {
      activity_name: name,
      activity_date: date,
      duration: Number(duration) || null,
      notes,
      activity_type: activityType || undefined,
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
    setActivityType(a.activity_type || '');
    setAddingType(false);
    setNewTypeName('');
    setEditingTypeId(null);
    setEditingTypeName('');
  }

  async function submitEdit() {
    if (!editing) return;
    await api.patch(`/coach/training-activities/${editing.activity_id}`, {
      activity_name: name,
      activity_date: date,
      duration: Number(duration) || null,
      notes,
      activity_type: activityType || null,
    });
    setEditing(null);
    showToast(`"${name}" updated`);
    loadActivities();
  }

  async function openView(a: TrainingActivity) {
    const participants = await api.get<ParticipationRecord[]>(`/coach/training-activities/${a.activity_id}/participation`);
    setViewing({ activity: a, participants });
  }

  async function createActivityType() {
    const name = newTypeName.trim();
    if (!name) return;
    setCreatingType(true);
    try {
      const created = await api.post<ActivityType>('/coach/activity-types', { name });
      await loadActivityTypes();
      setActivityType(created.name);
      setNewTypeName('');
      showToast(`"${created.name}" added as an activity type`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Unable to add activity type');
    } finally {
      setCreatingType(false);
    }
  }

  function startEditType(t: ActivityType) {
    setEditingTypeId(t.activity_type_id);
    setEditingTypeName(t.name);
  }

  function cancelEditType() {
    setEditingTypeId(null);
    setEditingTypeName('');
  }

  async function saveEditType() {
    const name = editingTypeName.trim();
    if (!name || editingTypeId == null) return;
    const wasSelected = activityTypes?.find((t) => t.activity_type_id === editingTypeId)?.name === activityType;
    setSavingType(true);
    try {
      const updated = await api.patch<ActivityType>(`/coach/activity-types/${editingTypeId}`, { name });
      await loadActivityTypes();
      if (wasSelected) setActivityType(updated.name);
      cancelEditType();
      showToast(`Renamed to "${updated.name}"`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Unable to rename activity type');
    } finally {
      setSavingType(false);
    }
  }

  async function deleteActivityType(t: ActivityType) {
    try {
      await api.delete(`/coach/activity-types/${t.activity_type_id}`);
      if (activityType === t.name) setActivityType('');
      await loadActivityTypes();
      showToast(`"${t.name}" removed`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Unable to remove activity type');
    }
  }

  function typeField() {
    return (
      <div className="field">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label>Activity type</label>
          {!addingType && (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: 12, padding: '2px 0' }}
              onClick={() => setAddingType(true)}
            >
              + New type
            </button>
          )}
        </div>
        {addingType ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                className="input"
                placeholder="e.g. Conditioning"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createActivityType();
                }}
                autoFocus
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={createActivityType}
                disabled={creatingType || !newTypeName.trim()}
              >
                {creatingType ? 'Adding…' : 'Add'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setAddingType(false);
                  setNewTypeName('');
                  cancelEditType();
                }}
              >
                Cancel
              </button>
            </div>
            {activityTypes && activityTypes.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 180, overflowY: 'auto', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-sm)' }}>
                {activityTypes.map((t) => (
                  <div
                    key={t.activity_type_id}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderBottom: '1px solid var(--color-divider)' }}
                  >
                    {editingTypeId === t.activity_type_id ? (
                      <>
                        <input
                          className="input"
                          style={{ flex: 1, minHeight: 30, fontSize: 13 }}
                          value={editingTypeName}
                          onChange={(e) => setEditingTypeName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditType();
                            if (e.key === 'Escape') cancelEditType();
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ fontSize: 12, padding: '2px 6px' }}
                          onClick={saveEditType}
                          disabled={savingType || !editingTypeName.trim()}
                        >
                          Save
                        </button>
                        <button type="button" className="btn btn-ghost" style={{ fontSize: 12, padding: '2px 6px' }} onClick={cancelEditType}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 1, fontSize: 13 }}>{t.name}</span>
                        <button type="button" className="btn btn-ghost btn-icon" aria-label={`Edit ${t.name}`} onClick={() => startEditType(t)}>
                          <PencilIcon />
                        </button>
                        <button type="button" className="btn btn-ghost btn-icon" aria-label={`Remove ${t.name}`} onClick={() => deleteActivityType(t)}>
                          <TrashIcon />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Select
            value={activityType}
            onChange={setActivityType}
            placeholder="General (no specific type)"
            options={[
              { value: '', label: 'General (no specific type)' },
              ...(activityTypes || []).map((t) => ({ value: t.name, label: t.name })),
            ]}
          />
        )}
      </div>
    );
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
              <th>Type</th>
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
                <td>{a.activity_type ? <span className="tag tag-info">{a.activity_type}</span> : <span style={{ opacity: 0.5 }}>—</span>}</td>
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
              <tr><td colSpan={6} style={{ opacity: 0.6, textAlign: 'center', padding: 24 }}>No training activities logged yet.</td></tr>
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
            {typeField()}
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
            {typeField()}
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
                <span className={participationTag(p.participation_status)}>{p.participation_status}</span>
              </div>
            ))}
            {viewing.participants.length === 0 && <div style={{ opacity: 0.6, fontSize: 13.5 }}>No participants recorded.</div>}
          </div>
        </DialogShell>
      )}
    </>
  );
}
