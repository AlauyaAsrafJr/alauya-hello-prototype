import { useEffect, useState } from 'react';
import { api, ApiError } from '../../api/client';
import type { FeedbackCategory, Sport } from '../../api/domain';
import { TrashIcon } from '../../icons';
import { PasswordRow } from '../../components/PasswordRow';
import { Select } from '../../components/Select';

interface SettingsPageProps {
  showToast: (msg: string) => void;
}

export function SettingsPage({ showToast }: SettingsPageProps) {
  const [sports, setSports] = useState<Sport[] | null>(null);
  const [newSport, setNewSport] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [categorySport, setCategorySport] = useState('');
  const [categories, setCategories] = useState<FeedbackCategory[] | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  async function load() {
    const data = await api.get<Sport[]>('/admin/sports');
    setSports(data);
    setCategorySport((prev) => prev || data[0]?.name || '');
  }

  async function loadCategories(sportName: string) {
    if (!sportName) {
      setCategories([]);
      return;
    }
    const data = await api.get<FeedbackCategory[]>(`/admin/feedback-categories?sport=${encodeURIComponent(sportName)}`);
    setCategories(data);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    loadCategories(categorySport);
  }, [categorySport]);

  async function addSport() {
    const name = newSport.trim();
    if (!name) return;
    setSubmitting(true);
    try {
      await api.post('/admin/sports', { name });
      setNewSport('');
      showToast(`${name} added`);
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Unable to add sport');
    } finally {
      setSubmitting(false);
    }
  }

  async function removeSport(sport: Sport) {
    try {
      await api.delete(`/admin/sports/${sport.sport_id}`);
      showToast(`${sport.name} removed`);
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Unable to remove sport');
    }
  }

  async function addCategory() {
    const name = newCategory.trim();
    if (!name || !categorySport) return;
    setCategorySubmitting(true);
    try {
      await api.post('/admin/feedback-categories', { sport_name: categorySport, name });
      setNewCategory('');
      showToast(`${name} added to ${categorySport}`);
      loadCategories(categorySport);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Unable to add category');
    } finally {
      setCategorySubmitting(false);
    }
  }

  async function removeCategory(category: FeedbackCategory) {
    try {
      await api.delete(`/admin/feedback-categories/${category.category_id}`);
      showToast(`${category.name} removed`);
      loadCategories(categorySport);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Unable to remove category');
    }
  }

  return (
    <>
    <div className="card elev-sm" style={{ padding: 24, maxWidth: 560, marginBottom: 20 }}>
      <div className="card-kicker">System configuration</div>
      <div className="card-title" style={{ marginBottom: 6 }}>Manage sports</div>
      <p className="card-body" style={{ marginBottom: 16 }}>
        Sports/teams available when creating coach and player accounts. Add a new one here as soon as MSU
        stands up a new varsity program — no code change needed.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <input
          className="input"
          placeholder="e.g. Badminton"
          value={newSport}
          onChange={(e) => setNewSport(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addSport();
          }}
        />
        <button type="button" className="btn btn-primary" onClick={addSport} disabled={submitting || !newSport.trim()}>
          {submitting ? 'Adding…' : 'Add sport'}
        </button>
      </div>

      {sports === null ? (
        <div className="card-body">Loading sports…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {sports.map((s) => (
            <div key={s.sport_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-divider)' }}>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{s.name}</span>
              <button type="button" className="btn btn-ghost btn-icon" aria-label={`Remove ${s.name}`} onClick={() => removeSport(s)}>
                <TrashIcon />
              </button>
            </div>
          ))}
          {sports.length === 0 && <div style={{ opacity: 0.6, fontSize: 13.5, padding: '8px 0' }}>No sports set up yet.</div>}
        </div>
      )}
    </div>

    <div className="card elev-sm" style={{ padding: 24, maxWidth: 560, marginBottom: 20 }}>
      <div className="card-kicker">System configuration</div>
      <div className="card-title" style={{ marginBottom: 6 }}>Manage feedback categories</div>
      <p className="card-body" style={{ marginBottom: 16 }}>
        Skill categories coaches can rate players on, specific to each sport (e.g. "Shooting" for Basketball,
        "Serving" for Volleyball), so feedback stays relevant no matter how many sports the program runs.
      </p>

      <div className="field" style={{ marginBottom: 14 }}>
        <label>Sport</label>
        <Select
          value={categorySport}
          onChange={setCategorySport}
          placeholder="No sports set up yet"
          options={(sports || []).map((s) => ({ value: s.name, label: s.name }))}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <input
          className="input"
          placeholder="e.g. Shooting"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addCategory();
          }}
          disabled={!categorySport}
        />
        <button
          type="button"
          className="btn btn-primary"
          onClick={addCategory}
          disabled={categorySubmitting || !newCategory.trim() || !categorySport}
        >
          {categorySubmitting ? 'Adding…' : 'Add category'}
        </button>
      </div>

      {categories === null ? (
        <div className="card-body">Loading categories…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {categories.map((c) => (
            <div key={c.category_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-divider)' }}>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{c.name}</span>
              <button type="button" className="btn btn-ghost btn-icon" aria-label={`Remove ${c.name}`} onClick={() => removeCategory(c)}>
                <TrashIcon />
              </button>
            </div>
          ))}
          {categories.length === 0 && (
            <div style={{ opacity: 0.6, fontSize: 13.5, padding: '8px 0' }}>
              {categorySport ? `No categories set up for ${categorySport} yet.` : 'Add a sport first.'}
            </div>
          )}
        </div>
      )}
    </div>

    <div className="card elev-sm" style={{ padding: 24, maxWidth: 560 }}>
      <div className="card-kicker">Security</div>
      <div className="card-title" style={{ marginBottom: 6 }}>Account</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <PasswordRow showToast={showToast} />
      </div>
    </div>
    </>
  );
}
