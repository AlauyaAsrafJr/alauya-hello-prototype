import { useEffect, useRef, useState } from 'react';

// Wraps a scrollable region with our own always-visible slider, since native
// scrollbars are invisible-by-default "overlay" style on a lot of modern
// browsers/OSes and never show up no matter how overflow is configured.
export function CustomScrollbar({ maxHeight, children, style }) {
  const contentRef = useRef(null);
  const trackRef = useRef(null);
  const [thumb, setThumb] = useState({ top: 0, height: 0, visible: false });

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return undefined;

    function update() {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight <= clientHeight + 1) {
        setThumb({ top: 0, height: 0, visible: false });
        return;
      }
      const height = Math.max(24, (clientHeight / scrollHeight) * clientHeight);
      const maxTop = clientHeight - height;
      const top = maxTop <= 0 ? 0 : (scrollTop / (scrollHeight - clientHeight)) * maxTop;
      setThumb({ top, height, visible: true });
    }

    update();
    el.addEventListener('scroll', update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [children]);

  function onThumbPointerDown(e) {
    e.preventDefault();
    const el = contentRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    const startY = e.clientY;
    const startScrollTop = el.scrollTop;
    const { scrollHeight, clientHeight } = el;
    const scrollable = scrollHeight - clientHeight;
    const trackSpace = track.clientHeight - thumb.height;

    function onMove(ev) {
      const ratio = trackSpace <= 0 ? 0 : (ev.clientY - startY) / trackSpace;
      el.scrollTop = Math.min(scrollable, Math.max(0, startScrollTop + ratio * scrollable));
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  function onTrackPointerDown(e) {
    if (e.target !== trackRef.current) return;
    const el = contentRef.current;
    const rect = trackRef.current.getBoundingClientRect();
    const { scrollHeight, clientHeight } = el;
    const clickRatio = (e.clientY - rect.top) / rect.height;
    el.scrollTop = clickRatio * (scrollHeight - clientHeight);
  }

  return (
    <div style={{ position: 'relative', ...style }}>
      <div ref={contentRef} className="custom-scrollbar-content" style={{ maxHeight, overflowY: 'auto', paddingRight: 16 }}>
        {children}
      </div>
      <div
        ref={trackRef}
        onPointerDown={onTrackPointerDown}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 2,
          width: 8,
          borderRadius: 'var(--radius-pill)',
          background: thumb.visible ? 'var(--color-divider)' : 'transparent',
        }}
      >
        {thumb.visible && (
          <div
            onPointerDown={onThumbPointerDown}
            style={{
              position: 'absolute',
              top: thumb.top,
              height: thumb.height,
              width: '100%',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--color-neutral-500)',
              cursor: 'grab',
            }}
          />
        )}
      </div>
    </div>
  );
}
