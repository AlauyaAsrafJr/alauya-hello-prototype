import { useState, type FormEvent } from 'react';
import { useAuth, type RegisterPlayerForm } from './AuthContext';
import { ApiError } from '../api/client';

interface RegisterPageProps {
  onGoLogin: () => void;
}

const EMPTY_FORM: RegisterPlayerForm = {
  username: '',
  password: '',
  first_name: '',
  last_name: '',
  email: '',
  contact_number: '',
  date_of_birth: '',
  team: '',
};

export function RegisterPage({ onGoLogin }: RegisterPageProps) {
  const { registerPlayer } = useAuth();
  const [form, setForm] = useState<RegisterPlayerForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof RegisterPlayerForm>(key: K, value: RegisterPlayerForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await registerPlayer(form);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to register. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)',
        fontFamily: 'var(--font-body)',
        color: 'var(--color-text)',
        padding: '32px 16px',
      }}
    >
      <div className="card elev-md" style={{ width: 460, padding: 32 }}>
        <div className="card-kicker">Player registration</div>
        <div className="card-title" style={{ marginBottom: 4 }}>Create your ACTIBASE account</div>
        <p className="card-body" style={{ marginBottom: 20 }}>
          Registration is for varsity players. Coach and administrator accounts are created by the sports office.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>First name</label>
              <input className="input" value={form.first_name} onChange={(e) => update('first_name', e.target.value)} required />
            </div>
            <div className="field">
              <label>Last name</label>
              <input className="input" value={form.last_name} onChange={(e) => update('last_name', e.target.value)} required />
            </div>
          </div>

          <div className="field">
            <label>Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Username</label>
              <input className="input" value={form.username} onChange={(e) => update('username', e.target.value)} required />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Contact number</label>
              <input className="input" value={form.contact_number} onChange={(e) => update('contact_number', e.target.value)} />
            </div>
            <div className="field">
              <label>Date of birth</label>
              <input
                className="input"
                type="date"
                value={form.date_of_birth}
                onChange={(e) => update('date_of_birth', e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label>Team</label>
            <input className="input" placeholder="e.g. Varsity Basketball" value={form.team} onChange={(e) => update('team', e.target.value)} />
          </div>

          {error && <div style={{ fontSize: 13, color: 'var(--color-accent-700)' }}>{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: 4 }}>
            {submitting ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <div style={{ marginTop: 18, fontSize: 13, textAlign: 'center' }}>
          Already have an account?{' '}
          <button type="button" className="btn btn-ghost" style={{ padding: 0, fontSize: 13 }} onClick={onGoLogin}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
