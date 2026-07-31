import { DialogShell } from './DialogShell';

export function ConfirmDialog({ data, onClose, onConfirm }) {
  return (
    <DialogShell
      title={data.title}
      onClose={onClose}
      actions={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>
            {data.confirmLabel}
          </button>
        </>
      }
    >
      <div className="dialog-body">{data.body}</div>
    </DialogShell>
  );
}
