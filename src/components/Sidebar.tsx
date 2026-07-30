import type { ComponentType } from 'react';
import { LogoutIcon } from '../icons';

export interface NavItem {
  key: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
}

interface SidebarProps {
  items: NavItem[];
  active: string;
  onNavigate: (key: string) => void;
  onLogout: () => void;
  roleLabel: string;
}

export function Sidebar({ items, active, onNavigate, onLogout, roleLabel }: SidebarProps) {
  return (
    <aside
      style={{
        width: 248,
        flex: 'none',
        background: 'var(--color-neutral-900)',
        color: 'var(--color-neutral-100)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div
        style={{
          padding: '22px 20px',
          borderBottom: '2px solid rgba(255,255,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            background: 'var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: 16,
            color: '#fff',
            flex: 'none',
          }}
        >
          A
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 17, letterSpacing: '-0.01em' }}>
            ACTIBASE
          </div>
          <div style={{ fontSize: 10.5, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{roleLabel}</div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onNavigate(key)}
              className="sidebar-nav-btn"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                background: isActive ? 'var(--color-accent)' : 'transparent',
                border: 0,
                color: isActive ? '#fff' : 'var(--color-neutral-300)',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Icon />
              {label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '14px 12px', borderTop: '2px solid rgba(255,255,255,0.12)' }}>
        <button
          type="button"
          onClick={onLogout}
          className="sidebar-logout-btn"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            background: 'transparent',
            border: 0,
            color: 'var(--color-neutral-300)',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
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
