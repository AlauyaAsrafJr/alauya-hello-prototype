import { useEffect, useRef, useState } from 'react';
import { KebabIcon } from '../icons';

export function RowActionsMenu({ actions, ariaLabel = 'Actions' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="btn btn-ghost btn-icon"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <KebabIcon />
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: 4,
            minWidth: 170,
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-divider)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
            zIndex: 20,
          }}
        >
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              role="menuitem"
              className="menu-item"
              disabled={a.disabled}
              onClick={() => {
                setOpen(false);
                a.onClick();
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 14px',
                background: 'transparent',
                border: 0,
                fontSize: 14.5,
                cursor: a.disabled ? 'default' : 'pointer',
                opacity: a.disabled ? 0.5 : 1,
                color: a.danger ? 'var(--color-danger-text)' : 'var(--color-neutral-200)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
