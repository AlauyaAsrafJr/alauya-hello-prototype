import { useState } from 'react';
import { api, ApiError } from '../api/client';

interface ChangePasswordCardProps {
  showToast: (msg: string) => void;
}

export function ChangePasswordCard({ showToast }: ChangePasswordCardProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to update password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card elev-sm" style={{ padding: 24, maxWidth: 560 }}>
      <div className="card-kicker">Security</div>
      <div className="card-title" style={{ marginBottom: 6 }}>Change password</div>
      <p className="card-body" style={{ marginBottom: 16 }}>
        If an administrator reset your password to the default, use this to set your own.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="field">
          <label>Current password</label>
          <input
            className="input"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="field">
          <label>New password</label>
          <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className="field">
          <label>Confirm new password</label>
          <input
            className="input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        {error && <div style={{ color: 'var(--color-danger)', fontSize: 12.5 }}>{error}</div>}
        <div>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={submitting}>
            {submitting ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </div>
    </div>
  );
}
