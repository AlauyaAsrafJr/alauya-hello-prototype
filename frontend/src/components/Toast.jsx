export function Toast({ message }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 28,
        background: 'var(--color-surface-3)',
        border: '1px solid var(--color-divider)',
        color: 'var(--color-text)',
        padding: '12px 18px',
        fontSize: 15,
        fontWeight: 600,
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 100,
      }}
    >
      {message}
    </div>
  );
}
