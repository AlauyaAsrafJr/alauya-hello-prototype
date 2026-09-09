import { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import {
  DashboardIcon,
  UsersIcon,
  PlayersIcon,
  AttendanceIcon,
  ReportsIcon,
  ArchiveIcon,
  HeartPulseIcon,
  SettingsIcon,
  UserPlusIcon,
} from '../icons';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { PlayersPage } from './pages/PlayersPage';
import { PlayerRequestsPage } from './pages/PlayerRequestsPage';
import { AttendancePage } from './pages/AttendancePage';
import { ReportsPage } from './pages/ReportsPage';
import { ArchivePage } from './pages/ArchivePage';
import { SystemStatisticsPage } from './pages/SystemStatisticsPage';
import { SettingsPage } from './pages/SettingsPage';

const PAGE_TITLES = {
  dashboard: ['Dashboard', 'Overview of players, coaches, and activity across the program'],
  users: ['Manage system users', 'Create, deactivate, and reset access for player, coach, and admin accounts'],
  players: ['Player data', 'Access all varsity player records'],
  'player-requests': ['Player requests', 'Review players coaches have added, and accept or reject them'],
  attendance: ['Attendance', 'Program-wide attendance records'],
  reports: ['Reports & analytics', 'Generate, review, and approve program reports'],
  archive: ['Archive', 'Restore or permanently remove archived records'],
  system: ['System statistics', 'Login history and player health monitoring'],
  settings: ['Settings', 'Account and system configuration'],
};

export function AdminApp() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const { toast, showToast } = useToast();

  useEffect(() => {
    api
      .get('/admin/player-requests?status=pending')
      .then((data) => setPendingRequestCount(data.length))
      .catch(() => {});
  }, [page]);

  if (!user) return null;
  const [pageTitle, pageSubtitle] = PAGE_TITLES[page];

  const NAV_ITEMS = [
    { key: 'dashboard', label: 'Dashboard', icon: DashboardIcon, group: 'Overview' },
    { key: 'users', label: 'Manage Users', icon: UsersIcon, group: 'People' },
    { key: 'players', label: 'Player Data', icon: PlayersIcon, group: 'People' },
    { key: 'player-requests', label: 'Player Requests', icon: UserPlusIcon, group: 'People', badge: pendingRequestCount },
    { key: 'attendance', label: 'Attendance', icon: AttendanceIcon, group: 'Operations' },
    { key: 'reports', label: 'Reports & Analytics', icon: ReportsIcon, group: 'Operations' },
    { key: 'archive', label: 'Archive', icon: ArchiveIcon, group: 'Operations' },
    { key: 'system', label: 'System Statistics', icon: HeartPulseIcon, group: 'System' },
    { key: 'settings', label: 'Settings', icon: SettingsIcon, group: 'System' },
  ];

  return (
    <AppShell
      items={NAV_ITEMS}
      active={page}
      onNavigate={(key) => setPage(key)}
      onLogout={logout}
      roleLabel="Administrator"
      displayName={user.display_name}
      pageTitle={pageTitle}
      pageSubtitle={pageSubtitle}
      notifCount={pendingRequestCount}
      notifMessage={
        pendingRequestCount > 0
          ? `${pendingRequestCount} player request${pendingRequestCount === 1 ? '' : 's'} awaiting your review`
          : undefined
      }
      notifActionLabel="Review requests"
      onNotifAction={() => setPage('player-requests')}
      onAccountSettings={() => setPage('settings')}
    >
      {page === 'dashboard' && <DashboardPage onNavigate={(k) => setPage(k)} />}
      {page === 'users' && <UsersPage showToast={showToast} />}
      {page === 'players' && <PlayersPage />}
      {page === 'player-requests' && (
        <PlayerRequestsPage showToast={showToast} onCountChange={setPendingRequestCount} />
      )}
      {page === 'attendance' && <AttendancePage />}
      {page === 'reports' && <ReportsPage showToast={showToast} />}
      {page === 'archive' && <ArchivePage showToast={showToast} />}
      {page === 'system' && <SystemStatisticsPage />}
      {page === 'settings' && <SettingsPage showToast={showToast} />}

      {toast && <Toast message={toast} />}
    </AppShell>
  );
}
