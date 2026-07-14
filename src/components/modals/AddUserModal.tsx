import type { AddUserForm, UserRole } from '../../types';
import { DialogShell } from './DialogShell';

interface AddUserModalProps {
  form: AddUserForm;
  onClose: () => void;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onRoleChange: (value: UserRole) => void;
  onSubmit: () => void;
}

export function AddUserModal({ form, onClose, onNameChange, onEmailChange, onRoleChange, onSubmit }: AddUserModalProps) {
  return (
    <DialogShell
      title="Add new user"
      onClose={onClose}
      actions={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={onSubmit}>Add user</button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="field">
          <label>Full name</label>
          <input className="input" value={form.name} onChange={(e) => onNameChange(e.target.value)} />
        </div>
        <div className="field">
          <label>Email</label>
          <input className="input" value={form.email} onChange={(e) => onEmailChange(e.target.value)} />
        </div>
        <div className="field">
          <label>Role</label>
          <select className="input" value={form.role} onChange={(e) => onRoleChange(e.target.value as UserRole)}>
            <option value="Admin">Admin</option>
            <option value="Coach">Coach</option>
            <option value="Staff">Staff</option>
          </select>
        </div>
      </div>
    </DialogShell>
  );
}
