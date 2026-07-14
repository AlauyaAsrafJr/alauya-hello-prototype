import type { ViewDialogState } from '../../types';
import { DialogShell } from './DialogShell';

interface ViewDetailModalProps {
  data: ViewDialogState;
  onClose: () => void;
}

export function ViewDetailModal({ data, onClose }: ViewDetailModalProps) {
  return (
    <DialogShell
      title={data.title}
      onClose={onClose}
      actions={<button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {data.rows.map((row) => (
          <div
            key={row.k}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid var(--color-divider)',
              fontSize: 13.5,
            }}
          >
            <span style={{ opacity: 0.6 }}>{row.k}</span>
            <span style={{ fontWeight: 600 }}>{row.v}</span>
          </div>
        ))}
      </div>
    </DialogShell>
  );
}
