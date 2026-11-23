import { useRef, useState } from 'react';

const W = 600;
const H = 220;
const PAD_LEFT = 34;
const PAD_RIGHT = 12;
const PAD_TOP = 14;
const PAD_BOTTOM = 26;

/**
 * Single-series line trend chart (no legend needed - the title names the series).
 * `data` is [{ x: label, y: number }], already in display order.
 */
export function LineTrendChart({ title, subtitle, data, yMax = 100, yFormat = (v) => `${v}` }) {
  const wrapRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  const innerW = W - PAD_LEFT - PAD_RIGHT;
  const innerH = H - PAD_TOP - PAD_BOTTOM;
  const n = data.length;

  const xAt = (i) => PAD_LEFT + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yAt = (v) => PAD_TOP + innerH - (Math.max(0, Math.min(v, yMax)) / yMax) * innerH;

  const points = data.map((d, i) => ({ ...d, cx: xAt(i), cy: yAt(d.y) }));
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.cx.toFixed(1)} ${p.cy.toFixed(1)}`).join(' ');
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * yMax));

  function handleMove(e) {
    if (!points.length) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const dataX = pct * W;
    let nearest = 0;
    let best = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.cx - dataX);
      if (dist < best) {
        best = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  const hovered = hoverIndex != null ? points[hoverIndex] : null;

  return (
    <div className="card elev-sm" style={{ padding: 20 }}>
      <div className="card-title" style={{ marginBottom: 2 }}>
        {title}
      </div>
      {subtitle && <div style={{ fontSize: 13.5, opacity: 0.6, marginBottom: 10 }}>{subtitle}</div>}

      {data.length === 0 ? (
        <div style={{ opacity: 0.6, fontSize: 15, padding: '24px 0' }}>Not enough data yet.</div>
      ) : (
        <div
          ref={wrapRef}
          style={{ position: 'relative', width: '100%', aspectRatio: `${W} / ${H}` }}
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverIndex(null)}
        >
          <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}: ${data.map((d) => `${d.x} ${yFormat(d.y)}`).join(', ')}`}>
            {yTicks.map((t) => (
              <g key={t}>
                <line
                  x1={PAD_LEFT}
                  x2={W - PAD_RIGHT}
                  y1={yAt(t)}
                  y2={yAt(t)}
                  stroke="var(--color-divider)"
                  strokeWidth={1}
                />
                <text x={PAD_LEFT - 8} y={yAt(t) + 4} textAnchor="end" fontSize={11} fill="var(--color-neutral-500)">
                  {yFormat(t)}
                </text>
              </g>
            ))}

            {hovered && (
              <line
                x1={hovered.cx}
                x2={hovered.cx}
                y1={PAD_TOP}
                y2={H - PAD_BOTTOM}
                stroke="var(--color-neutral-600)"
                strokeWidth={1}
              />
            )}

            <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

            {points.map((p, i) => {
              const isEnd = i === points.length - 1;
              const isHovered = i === hoverIndex;
              if (!isEnd && !isHovered) return null;
              return (
                <g key={i}>
                  <circle cx={p.cx} cy={p.cy} r={6} fill="var(--color-surface)" />
                  <circle cx={p.cx} cy={p.cy} r={4} fill="var(--color-accent)" />
                </g>
              );
            })}

            {points.map((p, i) => {
              const showEvery = Math.ceil(n / 6) || 1;
              if (i % showEvery !== 0 && i !== n - 1) return null;
              return (
                <text key={i} x={p.cx} y={H - PAD_BOTTOM + 16} textAnchor="middle" fontSize={11} fill="var(--color-neutral-500)">
                  {p.x}
                </text>
              );
            })}
          </svg>

          {hovered && (
            <div
              style={{
                position: 'absolute',
                left: `${(hovered.cx / W) * 100}%`,
                top: `${(hovered.cy / H) * 100}%`,
                transform: 'translate(-50%, -130%)',
                background: 'var(--color-surface-3)',
                border: '1px solid var(--color-divider)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                fontSize: 13,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ fontWeight: 700 }}>{yFormat(hovered.y)}</div>
              <div style={{ opacity: 0.65, fontSize: 12 }}>{hovered.x}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
