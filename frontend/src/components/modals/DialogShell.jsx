export function DialogShell({ title, onClose, children, actions, wide }) {
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" style={wide ? { width: 'min(920px, 100%)' } : undefined} onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">{title}</div>
        {children}
        <div className="dialog-actions">{actions}</div>
      </div>
    </div>
  );
}
