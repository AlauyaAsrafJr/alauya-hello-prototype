import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { DialogShell } from '../../components/modals/DialogShell';
import { NoteIcon } from '../../icons';
import { formatLongDate } from '../../utils/date';

export function TrainingActivityPage() {
  const [activities, setActivities] = useState(null);
  const [noteView, setNoteView] = useState(null);

  useEffect(() => {
    api.get('/player/training-activities').then(setActivities);
  }, []);

  if (!activities) return <div className="card-body">Loading training activities…</div>;

  return (
    <>
      <div className="card elev-sm" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Activity</th>
                <th>Type</th>
                <th>Date</th>
                <th>Location</th>
                <th>Duration</th>
                <th>Coach</th>
                <th style={{ width: 70 }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((a) => (
                <tr key={a.activity_id}>
                  <td style={{ fontWeight: 600 }}>{a.activity_name}</td>
                  <td>
                    {a.activity_type ? <span className="tag tag-info">{a.activity_type}</span> : <span style={{ opacity: 0.5 }}>-</span>}
                  </td>
                  <td style={{ opacity: 0.75 }}>{formatLongDate(a.activity_date)}</td>
                  <td style={{ opacity: 0.75 }}>{a.location || '-'}</td>
                  <td style={{ opacity: 0.75 }}>{a.duration ? `${a.duration} min` : '-'}</td>
                  <td style={{ opacity: 0.75 }}>{a.coach_name}</td>
                  <td>
                    {a.notes ? (
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        aria-label={`View note for ${a.activity_name}`}
                        title="View note"
                        onClick={() => setNoteView(a)}
                      >
                        <NoteIcon size={16} />
                      </button>
                    ) : (
                      <span style={{ opacity: 0.5 }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
              {activities.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ opacity: 0.6, textAlign: 'center', padding: 24 }}>
                    No training activities logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {noteView && (
        <DialogShell
          title={`Notes - ${noteView.activity_name}`}
          onClose={() => setNoteView(null)}
          actions={
            <button type="button" className="btn btn-secondary" onClick={() => setNoteView(null)}>
              Close
            </button>
          }
        >
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.5 }}>{noteView.notes}</div>
        </DialogShell>
      )}
    </>
  );
}
