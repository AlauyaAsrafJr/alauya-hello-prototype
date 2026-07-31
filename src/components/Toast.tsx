interface ToastProps {
  message: string;
}

export function Toast({ message }: ToastProps) {
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
        fontSize: 13.5,
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
