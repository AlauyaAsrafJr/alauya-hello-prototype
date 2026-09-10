import { useEffect, useState } from 'react';
import { api, mediaUrl } from '../../api/client';

export function PlayerNotesPage({ onCountChange }) {
  const [notes, setNotes] = useState(null);

  async function load() {
    const data = await api.get('/coach/notes');
    setNotes(data);
    onCountChange?.(data.filter((n) => !n.is_read).length);
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(note) {
    await api.post(`/coach/notes/${note.note_id}/read`);
    load();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {notes?.map((n) => (
        <div
          key={n.note_id}
          className="card elev-sm"
          style={{
            padding: 16,
            borderLeft: n.is_read ? undefined : '3px solid var(--color-accent)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600 }}>{n.player_name}</span>
                {!n.is_read && <span className="tag tag-info">New</span>}
              </div>
              <div style={{ fontSize: 14.5, opacity: 0.55, marginTop: 2 }}>
                {n.note_date ? new Date(n.note_date).toLocaleString() : ''}
              </div>
            </div>
            {!n.is_read && (
              <button type="button" className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }} onClick={() => markRead(n)}>
                Mark as read
              </button>
            )}
          </div>
          <p style={{ fontSize: 15.5, marginTop: 10, marginBottom: n.photo_url ? 10 : 0, opacity: 0.9 }}>{n.content}</p>
          {n.photo_url && (
            <a href={mediaUrl(n.photo_url)} target="_blank" rel="noreferrer">
              <img
                src={mediaUrl(n.photo_url)}
                alt="Proof attached by player"
                style={{ maxHeight: 200, borderRadius: 8, display: 'block' }}
              />
            </a>
          )}
        </div>
      ))}
      {notes && notes.length === 0 && (
        <div className="card elev-sm" style={{ padding: 24, textAlign: 'center', opacity: 0.6 }}>
          No player notes yet.
        </div>
      )}
    </div>
  );
}
