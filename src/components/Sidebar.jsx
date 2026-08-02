import { LogoutIcon } from '../icons';

function initialsOf(name) {
  const parts = name.trim().split(/\s+/);
  return (
    parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

export function Sidebar({ items, active, onNavigate, onLogout, roleLabel, displayName, mobileOpen }) {
  let lastGroup;

  return (
    <aside
      className={mobileOpen ? 'app-sidebar open' : 'app-sidebar'}
      style={{
        flex: 'none',
        background: 'var(--color-bg)',
        borderRight: '1px solid var(--color-divider)',
        color: 'var(--color-neutral-300)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div
        style={{
          padding: '20px 18px',
          borderBottom: '1px solid var(--color-divider)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            background: '#fff',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
          }}
        >
          <img src="/sarimanok-logo.png" alt="ACTIBASE" style={{ width: 38, height: 38, objectFit: 'contain' }} />
        </div>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 16.5,
              letterSpacing: '-0.01em',
              color: 'var(--color-neutral-100)',
            }}
          >
            ACTIBASE
          </div>
          <div style={{ fontSize: 10.5, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{roleLabel}</div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {items.map(({ key, label, icon: Icon, group }) => {
          const isActive = active === key;
          const showGroupHeader = group && group !== lastGroup;
          lastGroup = group;
          return (
            <div key={key}>
              {showGroupHeader && (
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--color-neutral-600)',
                    padding: '14px 10px 6px',
                  }}
                >
                  {group}
                </div>
              )}
              <button
                type="button"
                onClick={() => onNavigate(key)}
                className="sidebar-nav-btn"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  background: isActive ? 'var(--color-accent-100)' : 'transparent',
                  border: 0,
                  borderRadius: 'var(--radius-sm)',
                  color: isActive ? 'var(--color-accent-400)' : 'var(--color-neutral-300)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Icon />
                {label}
              </button>
            </div>
          );
        })}
      </nav>

      <div style={{ padding: '12px', borderTop: '1px solid var(--color-divider)' }}>
        {displayName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', marginBottom: 4 }}>
            <div className="avatar-chip">{initialsOf(displayName)}</div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: 'var(--color-neutral-100)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayName}
              </div>
              <div style={{ fontSize: 10.5, opacity: 0.55 }}>{roleLabel}</div>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onLogout}
          className="sidebar-logout-btn"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 12px',
            background: 'transparent',
            border: 0,
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-neutral-300)',
            fontFamily: 'var(--font-body)',
            fontSize: 13.5,
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <LogoutIcon />
          Log out
        </button>
      </div>
    </aside>
  );
}
