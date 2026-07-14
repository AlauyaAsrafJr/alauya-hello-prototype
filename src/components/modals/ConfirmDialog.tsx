import type { ConfirmDialogState } from '../../types';
import { DialogShell } from './DialogShell';

interface ConfirmDialogProps {
  data: ConfirmDialogState;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({ data, onClose, onConfirm }: ConfirmDialogProps) {
  return (
    <DialogShell
      title={data.title}
      onClose={onClose}
      actions={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>{data.confirmLabel}</button>
        </>
      }
    >
      <div className="dialog-body">{data.body}</div>
    </DialogShell>
  );
}
