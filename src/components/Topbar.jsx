import { BellIcon, ChevronDownIcon, MenuIcon, MoonIcon, SunIcon } from '../icons';
import { useTheme } from '../theme/ThemeContext';

function initialsOf(name) {
  const parts = name.trim().split(/\s+/);
  return (
    parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

export function Topbar({
  pageTitle,
  pageSubtitle,
  displayName,
  notifOpen,
  profileOpen,
  notifCount = 0,
  notifMessage,
  onMenuClick,
  onToggleNotif,
  onToggleProfile,
  onAccountSettings,
  onLogout,
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="app-topbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        borderBottom: '1px solid var(--color-divider)',
        background: 'var(--color-bg)',
        position: 'sticky',
        top: 0,
        zIndex: 5,
        flex: 'none',
      }}
    >
      <button type="button" onClick={onMenuClick} aria-label="Open menu" className="menu-btn btn btn-secondary btn-icon">
        <MenuIcon />
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontSize: 22.5, margin: 0, color: 'var(--color-neutral-100)' }}>{pageTitle}</h1>
        <div style={{ fontSize: 13.5, color: 'var(--color-neutral-400)', marginTop: 2 }}>{pageSubtitle}</div>
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="btn btn-secondary btn-icon"
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>

      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={onToggleNotif}
          aria-label="Notifications"
          className="btn btn-secondary btn-icon"
          style={{ position: 'relative' }}
        >
          <BellIcon />
          {notifCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 7,
                right: 7,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--color-accent)',
                border: '1.5px solid var(--color-bg)',
              }}
            />
          )}
        </button>
        {notifOpen && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 46,
              width: 280,
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-divider)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              zIndex: 20,
            }}
          >
            <div
              style={{
                padding: '12px 14px',
                borderBottom: '1px solid var(--color-divider)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: 14.5,
                color: 'var(--color-neutral-100)',
              }}
            >
              Notifications
            </div>
            <div style={{ padding: '12px 14px', fontSize: 14.5, color: 'var(--color-neutral-300)', opacity: notifCount > 0 ? 1 : 0.7 }}>
              {notifMessage || "You're all caught up."}
            </div>
          </div>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={onToggleProfile}
          aria-label="Account menu"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            padding: 4,
            color: 'var(--color-neutral-300)',
          }}
        >
          <div
            className="avatar-chip"
            style={{ width: 34, height: 34, background: 'var(--color-accent-100)', color: 'var(--color-accent-400)' }}
          >
            {initialsOf(displayName)}
          </div>
          <ChevronDownIcon />
        </button>
        {profileOpen && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 48,
              width: 190,
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-divider)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              zIndex: 20,
            }}
          >
            <button
              type="button"
              onClick={onAccountSettings}
              className="menu-item"
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 14px',
                background: 'transparent',
                border: 0,
                fontSize: 14.5,
                cursor: 'pointer',
                color: 'var(--color-neutral-200)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Account settings
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="menu-item"
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 14px',
                background: 'transparent',
                border: 0,
                fontSize: 14.5,
                cursor: 'pointer',
                color: 'var(--color-accent-400)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
