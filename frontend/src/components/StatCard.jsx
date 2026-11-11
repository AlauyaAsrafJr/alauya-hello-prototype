export function StatCard({ label, value, icon: Icon, variant = 'accent', onView }) {
  return (
    <div className="card elev-sm stat-card">
      <div className={`icon-chip icon-chip-${variant} stat-card-icon`}>
        <Icon />
      </div>
      <div className="card-title stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {onView && (
        <button type="button" onClick={onView} className="btn btn-ghost stat-card-link">
          Quick view →
        </button>
      )}
    </div>
  );
}
