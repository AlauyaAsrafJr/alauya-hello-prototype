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
        background: 'var(--color-neutral-900)',
        color: '#fff',
        padding: '12px 18px',
        fontSize: 13.5,
        fontWeight: 600,
        boxShadow: 'var(--shadow-lg)',
        zIndex: 100,
      }}
    >
      {message}
    </div>
  );
}
