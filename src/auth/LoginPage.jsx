import { useState } from 'react';
import { useAuth } from './AuthContext';
import { ApiError } from '../api/client';
import { useTheme } from '../theme/ThemeContext';
import { MoonIcon, SunIcon } from '../icons';

export function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to log in. Please try again.');
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
        position: 'relative',
        padding: 16,
      }}
    >
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="btn btn-secondary btn-icon"
        style={{ position: 'absolute', top: 16, right: 16 }}
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>

      <div className="card elev-md" style={{ width: 'min(380px, 100%)', padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div
            style={{
              width: 34,
              height: 34,
              background: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 16,
              color: '#fff',
            }}
          >
            A
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18 }}>ACTIBASE</div>
        </div>

        <div className="card-title" style={{ marginBottom: 4 }}>
          Sign in
        </div>
        <p className="card-body" style={{ marginBottom: 20 }}>
          Varsity Player Engagement and Activity Tracking System — MSU Main Campus
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label>Username</label>
            <input
              className="input"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div style={{ fontSize: 13, color: 'var(--color-accent-700)' }}>{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: 4 }}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ marginTop: 18, fontSize: 12.5, textAlign: 'center', opacity: 0.6 }}>
          Accounts are created by the sports office administrator. Contact your coach or the admin office if you need access.
        </p>
      </div>
    </div>
  );
}
