import { useEffect, useState } from 'react';
import { api, ApiError } from '../../api/client';
import type { FeedbackCategory, PerformanceFeedback, PlayerProfile } from '../../api/domain';
import { StarIcon } from '../../icons';
import { Select } from '../../components/Select';

interface PerformanceFeedbackPageProps {
  showToast: (msg: string) => void;
}

function Rating({ value }: { value: number }) {
  return (
    <div style={{ display: 'flex', gap: 2, color: 'var(--color-accent)' }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ opacity: i < value ? 1 : 0.25 }}>
          <StarIcon size={14} />
        </span>
      ))}
    </div>
  );
}

export function PerformanceFeedbackPage({ showToast }: PerformanceFeedbackPageProps) {
  const [players, setPlayers] = useState<PlayerProfile[] | null>(null);
  const [feedback, setFeedback] = useState<PerformanceFeedback[] | null>(null);
  const [categories, setCategories] = useState<FeedbackCategory[] | null>(null);
  const [playerId, setPlayerId] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [comments, setComments] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  async function loadFeedback() {
    const data = await api.get<PerformanceFeedback[]>('/coach/performance-feedback');
    setFeedback(data);
  }

  async function loadCategories() {
    const data = await api.get<FeedbackCategory[]>('/coach/feedback-categories');
    setCategories(data);
  }

  useEffect(() => {
    api.get<PlayerProfile[]>('/coach/players').then(setPlayers);
    loadCategories();
    loadFeedback();
  }, []);

  async function submit() {
    if (!playerId || !comments.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/coach/performance-feedback', { player_id: playerId, comments, rating, category: category || undefined });
      setComments('');
      setRating(5);
      setCategory('');
      showToast('Performance feedback submitted');
      loadFeedback();
    } finally {
      setSubmitting(false);
    }
  }

  async function createCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    setCreatingCategory(true);
    try {
      const created = await api.post<FeedbackCategory>('/coach/feedback-categories', { name });
      await loadCategories();
      setCategory(created.name);
      setNewCategoryName('');
      setAddingCategory(false);
      showToast(`"${created.name}" added as a category`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Unable to add category');
    } finally {
      setCreatingCategory(false);
    }
  }

  return (
    <>
      <div className="card elev-sm" style={{ padding: 20, marginBottom: 24, maxWidth: 640 }}>
        <div className="card-kicker">Submit performance notes</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
          <div className="field">
            <label>Player</label>
            <Select
              value={playerId === '' ? '' : String(playerId)}
              onChange={(v) => setPlayerId(v ? Number(v) : '')}
              placeholder="Select a player"
              options={(players || []).map((p) => ({ value: String(p.player_id), label: `${p.first_name} ${p.last_name}` }))}
            />
          </div>
          <div className="field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Category</label>
              {!addingCategory && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: 12, padding: '2px 0' }}
                  onClick={() => setAddingCategory(true)}
                >
                  + New category
                </button>
              )}
            </div>
            {addingCategory ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  className="input"
                  placeholder="e.g. Free throws"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') createCategory();
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={createCategory}
                  disabled={creatingCategory || !newCategoryName.trim()}
                >
                  {creatingCategory ? 'Adding…' : 'Add'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setAddingCategory(false);
                    setNewCategoryName('');
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <Select
                value={category}
                onChange={setCategory}
                placeholder="General (no specific category)"
                options={[
                  { value: '', label: 'General (no specific category)' },
                  ...(categories || []).map((c) => ({ value: c.name, label: c.name })),
                ]}
              />
            )}
          </div>
          <div className="field">
            <label>Rating</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className="btn btn-icon"
                  style={{ color: n <= rating ? 'var(--color-accent)' : 'var(--color-divider)', border: '1px solid var(--color-divider)' }}
                  onClick={() => setRating(n)}
                  aria-label={`${n} star`}
                >
                  <StarIcon size={16} />
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Comments</label>
            <textarea className="input" style={{ minHeight: 80 }} value={comments} onChange={(e) => setComments(e.target.value)} />
          </div>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={submitting || !playerId || !comments.trim()} style={{ alignSelf: 'flex-start' }}>
            {submitting ? 'Submitting…' : 'Submit feedback'}
          </button>
        </div>
      </div>

      <div className="card-title" style={{ marginBottom: 10 }}>Recent feedback</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {feedback?.map((f) => (
          <div key={f.feedback_id} className="card elev-sm" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{f.player_name}</div>
                {f.category && <span className="tag tag-info">{f.category}</span>}
              </div>
              <Rating value={f.rating} />
            </div>
            <p className="card-body" style={{ marginBottom: 4 }}>{f.comments}</p>
            <div style={{ fontSize: 11.5, opacity: 0.55 }}>{f.feedback_date} · {f.coach_name}</div>
          </div>
        ))}
        {feedback && feedback.length === 0 && <div style={{ opacity: 0.6, fontSize: 13.5 }}>No feedback submitted yet.</div>}
      </div>
    </>
  );
}
