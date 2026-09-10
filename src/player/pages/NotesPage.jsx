import { useEffect, useRef, useState } from 'react';
import { api, ApiError, mediaUrl } from '../../api/client';

export function NotesPage({ showToast }) {
  const [notes, setNotes] = useState(null);
  const [content, setContent] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  async function load() {
    const data = await api.get('/player/notes');
    setNotes(data);
  }

  useEffect(() => {
    load();
  }, []);

  function handlePhotoSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function clearPhoto() {
    setPhoto(null);
    setPhotoPreview(null);
  }

  async function submit() {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      if (photo) formData.append('photo', photo);
      await api.upload('/player/notes', formData);
      setContent('');
      clearPhoto();
      showToast('Note submitted');
      await load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Unable to submit this note');
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

        {photoPreview && (
          <div style={{ marginTop: 10, position: 'relative', display: 'inline-block' }}>
            <img
              src={photoPreview}
              alt="Attachment preview"
              style={{ maxHeight: 160, borderRadius: 8, display: 'block' }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              style={{ marginTop: 6 }}
              onClick={clearPhoto}
            >
              Remove photo
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoSelected}
          />
          <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
            {photo ? 'Change photo' : 'Attach photo'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={submit}
            disabled={submitting || !content.trim()}
          >
            {submitting ? 'Submitting…' : 'Submit note'}
          </button>
        </div>
      </div>

      {notes === null ? (
        <div className="card-body">Loading notes…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
          {notes.map((n) => (
            <div key={n.note_id} className="card elev-sm" style={{ padding: 16 }}>
              <p className="card-body" style={{ marginBottom: 6 }}>
                {n.content}
              </p>
              {n.photo_url && (
                <a href={mediaUrl(n.photo_url)} target="_blank" rel="noreferrer">
                  <img
                    src={mediaUrl(n.photo_url)}
                    alt="Note attachment"
                    style={{ maxHeight: 140, borderRadius: 8, display: 'block', marginBottom: 8 }}
                  />
                </a>
              )}
              <div style={{ fontSize: 14.5, opacity: 0.55 }}>{new Date(n.note_date).toLocaleString()}</div>
            </div>
          ))}
          {notes.length === 0 && <div style={{ opacity: 0.6, fontSize: 15 }}>You haven't submitted any notes yet.</div>}
        </div>
      )}
    </>
  );
}
