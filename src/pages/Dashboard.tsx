import type { ComponentType } from 'react';
import type { Report } from '../types';

export interface StatCard {
  label: string;
  value: number;
  Icon: ComponentType<{ size?: number }>;
  onView: () => void;
}

export interface ChartBar {
  day: string;
  x: number;
  x2: number;
  y1: number;
  h1: number;
  y2: number;
  h2: number;
  lx: number;
}

export interface RecentReportRow extends Report {
  tagClass: string;
}

interface DashboardProps {
  statCards: StatCard[];
  chartBars: ChartBar[];
  recentReports: RecentReportRow[];
  onGoReports: () => void;
}

export function Dashboard({ statCards, chartBars, recentReports, onGoReports }: DashboardProps) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {statCards.map((c) => (
          <div key={c.label} className="card elev-sm" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  background: 'var(--color-accent-100)',
                  color: 'var(--color-accent-700)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <c.Icon />
              </div>
            </div>
            <div className="card-title" style={{ fontSize: 28, marginTop: 6 }}>{c.value}</div>
            <div style={{ fontSize: 12.5, opacity: 0.65, fontWeight: 600 }}>{c.label}</div>
            <button type="button" onClick={c.onView} className="btn btn-ghost" style={{ paddingInline: 0, marginTop: 2, fontSize: 12.5 }}>
              Quick view →
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
        <div className="card elev-sm" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <div className="card-title">Weekly activity &amp; attendance</div>
            <span className="tag tag-outline">This week</span>
          </div>
          <svg width="100%" height="200" viewBox="0 0 560 200" style={{ overflow: 'visible' }}>
            {chartBars.map((b, i) => (
              <g key={i}>
                <rect x={b.x} y={b.y1} width="26" height={b.h1} fill="var(--color-neutral-300)" />
                <rect x={b.x2} y={b.y2} width="26" height={b.h2} fill="var(--color-accent)" />
                <text x={b.lx} y={192} fontSize="11" fill="var(--color-text)" opacity="0.6" textAnchor="middle" fontFamily="var(--font-body)">
                  {b.day}
                </text>
              </g>
            ))}
          </svg>
          <div style={{ display: 'flex', gap: 18, marginTop: 8, fontSize: 12, opacity: 0.7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, background: 'var(--color-neutral-300)', display: 'inline-block' }} />
              Activities logged
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, background: 'var(--color-accent)', display: 'inline-block' }} />
              Attendance rate
            </div>
          </div>
        </div>

        <div className="card elev-sm" style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="card-title">Recent reports</div>
            <button type="button" onClick={onGoReports} className="btn btn-ghost" style={{ paddingInline: 0, fontSize: 12.5 }}>
              View all →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {recentReports.map((r) => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid var(--color-divider)',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: 11.5, opacity: 0.55 }}>{r.generatedOn}</div>
                </div>
                <span className={r.tagClass}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
