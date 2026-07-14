import type { AppUser, UserRole } from '../types';
import { EyeIcon, ArchiveIcon, TrashIcon, PlusIcon } from '../icons';

export interface UserRow extends AppUser {
  selected: boolean;
  statusTagClass: string;
  onToggle: () => void;
  onView: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

interface UsersPageProps {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  hasSelected: boolean;
  selectedCount: number;
  onArchiveSelected: () => void;
  onOpenAddUser: () => void;
  allSelected: boolean;
  onToggleAll: () => void;
  onSortByName: () => void;
  onSortByRole: () => void;
  onSortByLast: () => void;
  sortArrows: { name: string; role: string; lastActive: string };
  pagedUsers: UserRow[];
  pageLabel: string;
  onFirstPageDisabled: boolean;
  onLastPageDisabled: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export function UsersPage({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  hasSelected,
  selectedCount,
  onArchiveSelected,
  onOpenAddUser,
  allSelected,
  onToggleAll,
  onSortByName,
  onSortByRole,
  onSortByLast,
  sortArrows,
  pagedUsers,
  pageLabel,
  onFirstPageDisabled,
  onLastPageDisabled,
  onPrevPage,
  onNextPage,
}: UsersPageProps) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          className="input"
          style={{ maxWidth: 280 }}
          placeholder="Search users by name or email"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <select className="input" style={{ maxWidth: 170 }} value={roleFilter} onChange={(e) => onRoleFilterChange(e.target.value)}>
          <option value="all">All roles</option>
          <option value="Admin">Admin</option>
          <option value="Coach">Coach</option>
          <option value="Staff">Staff</option>
        </select>
        <div style={{ flex: 1 }} />
        {hasSelected && (
          <>
            <span style={{ fontSize: 12.5, opacity: 0.65 }}>{selectedCount} selected</span>
            <button type="button" className="btn btn-secondary" onClick={onArchiveSelected}>Archive selected</button>
          </>
        )}
        <button type="button" className="btn btn-primary" onClick={onOpenAddUser}>
          <PlusIcon />
          Add user
        </button>
      </div>

      <div className="card elev-sm" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input type="checkbox" checked={allSelected} onChange={onToggleAll} />
              </th>
              <th style={{ cursor: 'pointer' }} onClick={onSortByName}>Name {sortArrows.name}</th>
              <th>Email</th>
              <th style={{ cursor: 'pointer' }} onClick={onSortByRole}>Role {sortArrows.role}</th>
              <th>Status</th>
              <th style={{ cursor: 'pointer' }} onClick={onSortByLast}>Last active {sortArrows.lastActive}</th>
              <th style={{ width: 120 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedUsers.map((u) => (
              <tr key={u.id}>
                <td><input type="checkbox" checked={u.selected} onChange={u.onToggle} /></td>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td style={{ opacity: 0.75 }}>{u.email}</td>
                <td><span className="tag tag-neutral">{u.role as UserRole}</span></td>
                <td><span className={u.statusTagClass}>{u.status}</span></td>
                <td style={{ opacity: 0.65 }}>{u.lastActive}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button type="button" className="btn btn-ghost btn-icon" aria-label="View" onClick={u.onView}><EyeIcon /></button>
                    <button type="button" className="btn btn-ghost btn-icon" aria-label="Archive" onClick={u.onArchive}><ArchiveIcon size={15} /></button>
                    <button type="button" className="btn btn-ghost btn-icon" aria-label="Delete" onClick={u.onDelete}><TrashIcon /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '2px solid var(--color-divider)' }}>
          <span style={{ fontSize: 12.5, opacity: 0.6 }}>{pageLabel}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" className="btn btn-secondary" onClick={onPrevPage} disabled={onFirstPageDisabled}>Prev</button>
            <button type="button" className="btn btn-secondary" onClick={onNextPage} disabled={onLastPageDisabled}>Next</button>
          </div>
        </div>
      </div>
    </>
  );
}
