import { useEffect, useState } from 'react';
import { api, ApiError } from '../../api/client';
import type { FeedbackCategory, PerformanceFeedback, PlayerProfile } from '../../api/domain';
import { PencilIcon, StarIcon, TrashIcon } from '../../icons';
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
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);
  const [comments, setComments] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<number | ''>('');

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

  const historyFeedback = (feedback || []).filter((f) => f.player_id === historyFilter);

  async function createCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    setCreatingCategory(true);
    try {
      const created = await api.post<FeedbackCategory>('/coach/feedback-categories', { name });
      await loadCategories();
      setCategory(created.name);
      setNewCategoryName('');
      showToast(`"${created.name}" added as a category`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Unable to add category');
    } finally {
      setCreatingCategory(false);
    }
  }

  function startEditCategory(c: FeedbackCategory) {
    setEditingCategoryId(c.category_id);
    setEditingCategoryName(c.name);
  }

  function cancelEditCategory() {
    setEditingCategoryId(null);
    setEditingCategoryName('');
  }

  async function saveEditCategory() {
    const name = editingCategoryName.trim();
    if (!name || editingCategoryId == null) return;
    const wasSelected = categories?.find((c) => c.category_id === editingCategoryId)?.name === category;
    setSavingCategory(true);
    try {
      const updated = await api.patch<FeedbackCategory>(`/coach/feedback-categories/${editingCategoryId}`, { name });
      await loadCategories();
      if (wasSelected) setCategory(updated.name);
      cancelEditCategory();
      showToast(`Renamed to "${updated.name}"`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Unable to rename category');
    } finally {
      setSavingCategory(false);
    }
  }

  async function deleteCategory(c: FeedbackCategory) {
    try {
      await api.delete(`/coach/feedback-categories/${c.category_id}`);
      if (category === c.name) setCategory('');
      await loadCategories();
      showToast(`"${c.name}" removed`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Unable to remove category');
    }
  }

  return (
    <>
    <div style={{ display: 'flex', gap: 20, alignItems: 'stretch', flexWrap: 'wrap', marginBottom: 24 }}>
      <div className="card elev-sm" style={{ padding: 20, flex: '1 1 480px', maxWidth: 640 }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                      cancelEditCategory();
                    }}
                  >
                    Cancel
                  </button>
                </div>
                {categories && categories.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 180, overflowY: 'auto', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-sm)' }}>
                    {categories.map((c) => (
                      <div
                        key={c.category_id}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderBottom: '1px solid var(--color-divider)' }}
                      >
                        {editingCategoryId === c.category_id ? (
                          <>
                            <input
                              className="input"
                              style={{ flex: 1, minHeight: 30, fontSize: 13 }}
                              value={editingCategoryName}
                              onChange={(e) => setEditingCategoryName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditCategory();
                                if (e.key === 'Escape') cancelEditCategory();
                              }}
                              autoFocus
                            />
                            <button
                              type="button"
                              className="btn btn-ghost"
                              style={{ fontSize: 12, padding: '2px 6px' }}
                              onClick={saveEditCategory}
                              disabled={savingCategory || !editingCategoryName.trim()}
                            >
                              Save
                            </button>
                            <button type="button" className="btn btn-ghost" style={{ fontSize: 12, padding: '2px 6px' }} onClick={cancelEditCategory}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <span style={{ flex: 1, fontSize: 13 }}>{c.name}</span>
                            <button type="button" className="btn btn-ghost btn-icon" aria-label={`Edit ${c.name}`} onClick={() => startEditCategory(c)}>
                              <PencilIcon />
                            </button>
                            <button type="button" className="btn btn-ghost btn-icon" aria-label={`Remove ${c.name}`} onClick={() => deleteCategory(c)}>
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

      <div className="card elev-sm" style={{ padding: 20, flex: '1 1 360px', maxWidth: 480, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <div className="card-title" style={{ margin: 0 }}>
            {historyFilter === ''
              ? 'Feedback history'
              : `Feedback history — ${players?.find((p) => p.player_id === historyFilter)?.first_name || ''} ${players?.find((p) => p.player_id === historyFilter)?.last_name || ''}`}
          </div>
          <div style={{ flex: 1 }} />
          <Select
            style={{ minWidth: 200 }}
            value={historyFilter === '' ? '' : String(historyFilter)}
            onChange={(v) => setHistoryFilter(v ? Number(v) : '')}
            placeholder="Select a player"
            options={(players || []).map((p) => ({ value: String(p.player_id), label: `${p.first_name} ${p.last_name}` }))}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', paddingRight: 4, flex: 1 }}>
          {historyFilter === '' ? (
            <div style={{ opacity: 0.6, fontSize: 13.5 }}>Select a player to view their feedback history.</div>
          ) : (
            <>
              {historyFeedback.map((f) => (
                <div key={f.feedback_id} style={{ paddingBottom: 10, borderBottom: '1px solid var(--color-divider)' }}>
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
              {historyFeedback.length === 0 && (
                <div style={{ opacity: 0.6, fontSize: 13.5 }}>No feedback for this player yet.</div>
              )}
            </>
          )}
        </div>
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
