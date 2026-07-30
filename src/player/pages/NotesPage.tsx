import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { PlayerNote } from '../../api/domain';

interface NotesPageProps {
  showToast: (msg: string) => void;
}

export function NotesPage({ showToast }: NotesPageProps) {
  const [notes, setNotes] = useState<PlayerNote[] | null>(null);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const data = await api.get<PlayerNote[]>('/player/notes');
    setNotes(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit() {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/player/notes', { content });
      setContent('');
      showToast('Note submitted');
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="card elev-sm" style={{ padding: 20, marginBottom: 20, maxWidth: 640 }}>
        <div className="card-kicker">Submit a note</div>
        <p className="card-body" style={{ marginBottom: 10 }}>
          Record a personal reflection, concern, or update for your coach and the sports office to see.
        </p>
        <textarea
          className="input"
          style={{ width: '100%', minHeight: 90, resize: 'vertical' }}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note…"
        />
        <button type="button" className="btn btn-primary" style={{ marginTop: 10 }} onClick={submit} disabled={submitting || !content.trim()}>
          {submitting ? 'Submitting…' : 'Submit note'}
        </button>
      </div>

      {notes === null ? (
        <div className="card-body">Loading notes…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
          {notes.map((n) => (
            <div key={n.note_id} className="card elev-sm" style={{ padding: 16 }}>
              <p className="card-body" style={{ marginBottom: 6 }}>{n.content}</p>
              <div style={{ fontSize: 11.5, opacity: 0.55 }}>{new Date(n.note_date).toLocaleString()}</div>
            </div>
          ))}
          {notes.length === 0 && <div style={{ opacity: 0.6, fontSize: 13.5 }}>You haven't submitted any notes yet.</div>}
        </div>
      )}
    </>
  );
}
