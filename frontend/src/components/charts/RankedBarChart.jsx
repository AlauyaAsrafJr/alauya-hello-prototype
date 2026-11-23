import { useState } from 'react';

const BAR_HEIGHT = 22;
const BAR_GAP = 14;

/**
 * Ranked horizontal bar chart - one hue, largest first, direct value labels.
 * `data` is [{ label, value }]; caller passes it pre-sorted.
 */
export function RankedBarChart({ title, subtitle, data, valueFormat = (v) => `${v}` }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="card elev-sm" style={{ padding: 20 }}>
      <div className="card-title" style={{ marginBottom: 2 }}>
        {title}
      </div>
      {subtitle && <div style={{ fontSize: 13.5, opacity: 0.6, marginBottom: 14 }}>{subtitle}</div>}

      {data.length === 0 ? (
        <div style={{ opacity: 0.6, fontSize: 15, padding: '24px 0' }}>No data yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: BAR_GAP }}>
          {data.map((d, i) => {
            const pct = (d.value / max) * 100;
            const isHovered = i === hoverIndex;
            return (
              <div key={d.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{d.label}</span>
                  <span style={{ opacity: 0.7 }}>{valueFormat(d.value)}</span>
                </div>
                <div
                  style={{ background: 'var(--color-surface-2)', borderRadius: 999, height: BAR_HEIGHT }}
                  onPointerEnter={() => setHoverIndex(i)}
                  onPointerLeave={() => setHoverIndex((cur) => (cur === i ? null : cur))}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      borderRadius: 999,
                      background: 'var(--color-accent)',
                      opacity: isHovered ? 0.85 : 1,
                      transition: 'width 0.3s ease, opacity 0.15s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
