import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell({
  items,
  active,
  onNavigate,
  onLogout,
  roleLabel,
  displayName,
  pageTitle,
  pageSubtitle,
  notifCount,
  notifMessage,
  onAccountSettings,
  children,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  function closeMenus() {
    if (profileOpen || notifOpen) {
      setProfileOpen(false);
      setNotifOpen(false);
    }
  }

  function handleNavigate(key) {
    onNavigate(key);
    setProfileOpen(false);
    setNotifOpen(false);
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--color-bg)',
        fontFamily: 'var(--font-body)',
        color: 'var(--color-text)',
      }}
    >
      <Sidebar
        items={items}
        active={active}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        roleLabel={roleLabel}
        displayName={displayName}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', overflowY: 'auto' }}>
        <Topbar
          pageTitle={pageTitle}
          pageSubtitle={pageSubtitle}
          displayName={displayName}
          roleLabel={roleLabel}
          notifOpen={notifOpen}
          profileOpen={profileOpen}
          notifCount={notifCount}
          notifMessage={notifMessage}
          onToggleNotif={(e) => {
            e.stopPropagation();
            setNotifOpen((v) => !v);
            setProfileOpen(false);
          }}
          onToggleProfile={(e) => {
            e.stopPropagation();
            setProfileOpen((v) => !v);
            setNotifOpen(false);
          }}
          onAccountSettings={() => {
            setProfileOpen(false);
            onAccountSettings?.();
          }}
          onLogout={onLogout}
        />

        <main style={{ flex: 1, padding: '28px 32px 60px', minWidth: 0 }} onClick={closeMenus}>
          {children}
        </main>
      </div>
    </div>
  );
}
