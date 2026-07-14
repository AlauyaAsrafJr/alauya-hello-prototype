import type { Player } from '../types';
import { EyeIcon, ArchiveIcon, TrashIcon } from '../icons';

export interface PlayerRow extends Player {
  selected: boolean;
  statusTagClass: string;
  attendanceTagClass: string;
  onToggle: () => void;
  onView: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

interface PlayersPageProps {
  search: string;
  onSearchChange: (value: string) => void;
  sportFilter: string;
  onSportFilterChange: (value: string) => void;
  sportOptions: string[];
  hasSelected: boolean;
  selectedCount: number;
  onArchiveSelected: () => void;
  allSelected: boolean;
  onToggleAll: () => void;
  onSortByName: () => void;
  onSortByAttendance: () => void;
  sortArrows: { name: string; attendance: string };
  pagedPlayers: PlayerRow[];
  pageLabel: string;
  onFirstPageDisabled: boolean;
  onLastPageDisabled: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export function PlayersPage({
  search,
  onSearchChange,
  sportFilter,
  onSportFilterChange,
  sportOptions,
  hasSelected,
  selectedCount,
  onArchiveSelected,
  allSelected,
  onToggleAll,
  onSortByName,
  onSortByAttendance,
  sortArrows,
  pagedPlayers,
  pageLabel,
  onFirstPageDisabled,
  onLastPageDisabled,
  onPrevPage,
  onNextPage,
}: PlayersPageProps) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          className="input"
          style={{ maxWidth: 280 }}
          placeholder="Search players by name"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <select className="input" style={{ maxWidth: 180 }} value={sportFilter} onChange={(e) => onSportFilterChange(e.target.value)}>
          <option value="all">All sports</option>
          {sportOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div style={{ flex: 1 }} />
        {hasSelected && (
          <>
            <span style={{ fontSize: 12.5, opacity: 0.65 }}>{selectedCount} selected</span>
            <button type="button" className="btn btn-secondary" onClick={onArchiveSelected}>Archive selected</button>
          </>
        )}
      </div>

      <div className="card elev-sm" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input type="checkbox" checked={allSelected} onChange={onToggleAll} />
              </th>
              <th style={{ cursor: 'pointer' }} onClick={onSortByName}>Name {sortArrows.name}</th>
              <th>Sport / Team</th>
              <th>Year</th>
              <th>Coach</th>
              <th style={{ cursor: 'pointer' }} onClick={onSortByAttendance}>Attendance {sortArrows.attendance}</th>
              <th>Status</th>
              <th style={{ width: 120 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedPlayers.map((p) => (
              <tr key={p.id}>
                <td><input type="checkbox" checked={p.selected} onChange={p.onToggle} /></td>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td style={{ opacity: 0.75 }}>{p.sport}</td>
                <td>{p.year}</td>
                <td style={{ opacity: 0.75 }}>{p.coach}</td>
                <td><span className={p.attendanceTagClass}>{p.attendance}%</span></td>
                <td><span className={p.statusTagClass}>{p.status}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button type="button" className="btn btn-ghost btn-icon" aria-label="View" onClick={p.onView}><EyeIcon /></button>
                    <button type="button" className="btn btn-ghost btn-icon" aria-label="Archive" onClick={p.onArchive}><ArchiveIcon size={15} /></button>
                    <button type="button" className="btn btn-ghost btn-icon" aria-label="Delete" onClick={p.onDelete}><TrashIcon /></button>
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
