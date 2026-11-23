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
    <div className="login-shell" style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text)' }}>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="btn btn-secondary btn-icon"
        style={{ position: 'fixed', top: 16, right: 16, zIndex: 1 }}
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>

      <div className="login-hero">
        <div className="login-hero-watermark" aria-hidden="true" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 52,
              height: 52,
              background: '#fff',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 'none',
            }}
          >
            <img src="/sarimanok-logo.png" alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          </div>
          <img src="/msu-seal.png" alt="Mindanao State University" title="Mindanao State University" style={{ height: 50, width: 'auto' }} />
        </div>

        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 44, lineHeight: 1.1 }}>ACTIBASE</div>
          <p style={{ fontSize: 17, maxWidth: 420, marginTop: 14, opacity: 0.92 }}>
            Varsity Player Engagement and Activity Tracking System for Mindanao State University - Main Campus.
          </p>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="card elev-md" style={{ width: 'min(380px, 100%)', padding: 32 }}>
          <div className="card-title" style={{ marginBottom: 4 }}>
            Sign in
          </div>
          <p className="card-body" style={{ marginBottom: 20 }}>
            Use the account your coach or the sports office administrator created for you.
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

            {error && <div style={{ fontSize: 14.5, color: 'var(--color-accent-700)' }}>{error}</div>}

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: 4 }}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={{ marginTop: 18, fontSize: 15.5, textAlign: 'center', opacity: 0.6 }}>
            Accounts are created by the sports office administrator. Contact your coach or the admin office if you need access.
          </p>
        </div>
      </div>
    </div>
  );
}
