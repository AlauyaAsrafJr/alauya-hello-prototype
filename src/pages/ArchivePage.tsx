import type { ArchiveItem } from '../types';
import { RestoreIcon, TrashIcon } from '../icons';

export interface ArchiveRow extends ArchiveItem {
  onRestore: () => void;
  onDeleteForever: () => void;
}

interface ArchivePageProps {
  allChecked: boolean;
  playerChecked: boolean;
  userChecked: boolean;
  sessionChecked: boolean;
  onFilterAll: () => void;
  onFilterPlayer: () => void;
  onFilterUser: () => void;
  onFilterSession: () => void;
  filteredArchive: ArchiveRow[];
}

export function ArchivePage({
  allChecked,
  playerChecked,
  userChecked,
  sessionChecked,
  onFilterAll,
  onFilterPlayer,
  onFilterUser,
  onFilterSession,
  filteredArchive,
}: ArchivePageProps) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div className="seg">
          <label className="seg-opt"><input type="radio" checked={allChecked} onChange={onFilterAll} />All</label>
          <label className="seg-opt"><input type="radio" checked={playerChecked} onChange={onFilterPlayer} />Players</label>
          <label className="seg-opt"><input type="radio" checked={userChecked} onChange={onFilterUser} />Users</label>
          <label className="seg-opt"><input type="radio" checked={sessionChecked} onChange={onFilterSession} />Sessions</label>
        </div>
      </div>
      <div className="card elev-sm" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Record</th>
              <th>Type</th>
              <th>Archived on</th>
              <th>Archived by</th>
              <th style={{ width: 150 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredArchive.map((a) => (
              <tr key={a.id}>
                <td style={{ fontWeight: 600 }}>{a.name}</td>
                <td><span className="tag tag-neutral">{a.type}</span></td>
                <td style={{ opacity: 0.65 }}>{a.archivedOn}</td>
                <td style={{ opacity: 0.65 }}>{a.archivedBy}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="btn btn-secondary" onClick={a.onRestore}>
                      <RestoreIcon />
                      Restore
                    </button>
                    <button type="button" className="btn btn-ghost btn-icon" aria-label="Delete permanently" onClick={a.onDeleteForever}>
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
