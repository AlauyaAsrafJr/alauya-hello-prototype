import { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon } from '../icons';

export function Select({ value, options, onChange, placeholder, style, disabled }) {
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
    function onScroll(e) {
      // Scrolling inside the open menu's own option list is fine; scrolling
      // any other ancestor (e.g. a tall dialog) would leave the absolutely
      // positioned menu floating over content it no longer lines up with, so
      // close it instead.
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={rootRef} style={{ position: 'relative', ...style }}>
      <button type="button" className="select-trigger" aria-expanded={open} disabled={disabled} onClick={() => setOpen((v) => !v)}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected?.label ?? placeholder ?? 'Select…'}
        </span>
        <ChevronDownIcon />
      </button>
      {open && (
        <div className="select-menu" role="listbox">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === value}
              className={`select-option${o.value === value ? ' select-option-active' : ''}`}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </button>
          ))}
          {options.length === 0 && <div className="select-empty">No options</div>}
        </div>
      )}
    </div>
  );
}
