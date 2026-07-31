export function DialogShell({ title, onClose, children, actions }) {
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">{title}</div>
        {children}
        <div className="dialog-actions">{actions}</div>
      </div>
    </div>
  );
}
