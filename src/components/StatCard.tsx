import type { ComponentType } from 'react';

export type StatCardVariant = 'accent' | 'info' | 'success' | 'warning' | 'danger';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: ComponentType<{ size?: number }>;
  variant?: StatCardVariant;
  onView?: () => void;
}

export function StatCard({ label, value, icon: Icon, variant = 'accent', onView }: StatCardProps) {
  return (
    <div className="card elev-sm" style={{ padding: 18 }}>
      <div className={`icon-chip icon-chip-${variant}`}>
        <Icon />
      </div>
      <div className="card-title" style={{ fontSize: 28, marginTop: 10 }}>{value}</div>
      <div style={{ fontSize: 12.5, opacity: 0.65, fontWeight: 600 }}>{label}</div>
      {onView && (
        <button type="button" onClick={onView} className="btn btn-ghost" style={{ paddingInline: 0, marginTop: 2, fontSize: 12.5 }}>
          Quick view →
        </button>
      )}
    </div>
  );
}
