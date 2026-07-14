import { BellIcon, ChevronDownIcon } from '../icons';

interface TopbarProps {
  pageTitle: string;
  pageSubtitle: string;
  notifOpen: boolean;
  profileOpen: boolean;
  onToggleNotif: (e: React.MouseEvent) => void;
  onToggleProfile: (e: React.MouseEvent) => void;
  onAccountSettings: () => void;
  onLogout: () => void;
}

export function Topbar({
  pageTitle,
  pageSubtitle,
  notifOpen,
  profileOpen,
  onToggleNotif,
  onToggleProfile,
  onAccountSettings,
  onLogout,
}: TopbarProps) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '16px 32px',
        borderBottom: '2px solid var(--color-divider)',
        background: 'var(--color-bg)',
        position: 'sticky',
        top: 0,
        zIndex: 5,
        flex: 'none',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>{pageTitle}</h1>
        <div style={{ fontSize: 12, color: 'var(--color-text)', opacity: 0.55, marginTop: 2 }}>{pageSubtitle}</div>
      </div>

      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={onToggleNotif}
          aria-label="Notifications"
          style={{
            width: 38,
            height: 38,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-divider)',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <BellIcon />
          <span
            style={{
              position: 'absolute',
              top: 7,
              right: 7,
              width: 8,
              height: 8,
              background: 'var(--color-accent)',
              border: '1.5px solid var(--color-bg)',
            }}
          />
        </button>
        {notifOpen && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 44,
              width: 300,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-divider)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 20,
            }}
          >
            <div
              style={{
                padding: '12px 14px',
                borderBottom: '2px solid var(--color-divider)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              Notifications
            </div>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-divider)', fontSize: 13 }}>
              3 attendance sessions pending review for Track &amp; Field.
            </div>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-divider)', fontSize: 13 }}>
              Monthly engagement report finished generating.
            </div>
            <div style={{ padding: '12px 14px', fontSize: 13 }}>2 new coach accounts awaiting approval.</div>
          </div>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={onToggleProfile}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 0, cursor: 'pointer', padding: 4 }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              background: 'var(--color-neutral-900)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            DW
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>Dana Whitfield</div>
            <div style={{ fontSize: 11, opacity: 0.55, lineHeight: 1.2 }}>Head Administrator</div>
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
              background: 'var(--color-surface)',
              border: '1px solid var(--color-divider)',
              boxShadow: 'var(--shadow-lg)',
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
                fontSize: 13,
                cursor: 'pointer',
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
                fontSize: 13,
                cursor: 'pointer',
                color: 'var(--color-accent-700)',
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
