import { useState } from 'react';
import { api, ApiError } from '../api/client';

interface PasswordRowProps {
  showToast: (msg: string) => void;
}

const MASK = '•'.repeat(10);

export function PasswordRow({ showToast }: PasswordRowProps) {
  const [editing, setEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function cancel() {
    setEditing(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  }

  async function submit() {
    setError('');
    if (!currentPassword || !newPassword) {
      setError('Fill in both your current and new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword });
      showToast('Password updated');
      cancel();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to update password');
    } finally {
      setSubmitting(false);
    }
  }

  if (editing) {
    return (
      <div style={{ padding: '8px 0', fontSize: 13.5 }}>
        <div style={{ opacity: 0.6, marginBottom: 8 }}>Password</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            className="input"
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <input
            className="input"
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            className="input"
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {error && <div style={{ color: 'var(--color-danger)', fontSize: 12 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={cancel}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={submit} disabled={submitting}>
              {submitting ? 'Updating…' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: 13.5 }}>
      <span style={{ opacity: 0.6 }}>Password</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontWeight: 600, letterSpacing: 2 }}>{MASK}</span>
        <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setEditing(true)}>Edit</button>
      </span>
    </div>
  );
}
