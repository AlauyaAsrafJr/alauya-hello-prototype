import { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { DashboardIcon, PlayersIcon, AttendanceIcon, ActivitiesIcon, StarIcon, ReportsIcon, ProfileIcon, NoteIcon } from '../icons';
import { DashboardPage } from './pages/DashboardPage';
import { PlayersPage } from './pages/PlayersPage';
import { AttendancePage } from './pages/AttendancePage';
import { TrainingActivitiesPage } from './pages/TrainingActivitiesPage';
import { PerformanceFeedbackPage } from './pages/PerformanceFeedbackPage';
import { PlayerNotesPage } from './pages/PlayerNotesPage';
import { ReportsPage } from './pages/ReportsPage';
import { ProfilePage } from './pages/ProfilePage';

const PAGE_TITLES = {
  dashboard: ['Dashboard', 'Team overview across attendance, activities, and performance'],
  players: ['Manage Players', 'View and update varsity player profiles'],
  attendance: ['Attendance', 'Record and review player attendance'],
  activities: ['Training Activities', 'Log and edit training sessions and participation'],
  feedback: ['Performance Feedback', 'Submit and review player performance evaluations'],
  notes: ['Player Notes', 'Personal notes and concerns submitted by your players'],
  reports: ['Analytics & Reports', 'Team analytics and generated reports'],
  profile: ['My Profile', 'View your coach information and update your password'],
};

export function CoachApp() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [unreadNoteCount, setUnreadNoteCount] = useState(0);
  const { toast, showToast } = useToast();

  useEffect(() => {
    api
      .get('/coach/notes')
      .then((data) => setUnreadNoteCount(data.filter((n) => !n.is_read).length))
      .catch(() => {});
  }, [page]);

  if (!user) return null;
  const [pageTitle, pageSubtitle] = PAGE_TITLES[page];

  const NAV_ITEMS = [
    { key: 'dashboard', label: 'Dashboard', icon: DashboardIcon, group: 'Overview' },
    { key: 'players', label: 'Manage Players', icon: PlayersIcon, group: 'Roster' },
    { key: 'attendance', label: 'Attendance', icon: AttendanceIcon, group: 'Operations' },
    { key: 'activities', label: 'Training Activities', icon: ActivitiesIcon, group: 'Operations' },
    { key: 'feedback', label: 'Performance Feedback', icon: StarIcon, group: 'Operations' },
    { key: 'notes', label: 'Player Notes', icon: NoteIcon, group: 'Operations', badge: unreadNoteCount },
    { key: 'reports', label: 'Analytics & Reports', icon: ReportsIcon, group: 'Insights' },
    { key: 'profile', label: 'My Profile', icon: ProfileIcon, group: 'Account' },
  ];

  return (
    <AppShell
      items={NAV_ITEMS}
      active={page}
      onNavigate={(key) => setPage(key)}
      onLogout={logout}
      roleLabel="Coach"
      displayName={user.display_name}
      pageTitle={pageTitle}
      pageSubtitle={pageSubtitle}
      notifCount={unreadNoteCount}
      notifMessage={
        unreadNoteCount > 0 ? `${unreadNoteCount} new player note${unreadNoteCount === 1 ? '' : 's'} to review` : undefined
      }
      notifActionLabel="View notes"
      onNotifAction={() => setPage('notes')}
      onAccountSettings={() => setPage('profile')}
    >
      {page === 'dashboard' && <DashboardPage onNavigate={(k) => setPage(k)} />}
      {page === 'players' && <PlayersPage showToast={showToast} />}
      {page === 'attendance' && <AttendancePage showToast={showToast} />}
      {page === 'activities' && <TrainingActivitiesPage showToast={showToast} />}
      {page === 'feedback' && <PerformanceFeedbackPage showToast={showToast} />}
      {page === 'notes' && <PlayerNotesPage onCountChange={setUnreadNoteCount} />}
      {page === 'reports' && <ReportsPage showToast={showToast} />}
      {page === 'profile' && <ProfilePage showToast={showToast} />}

      {toast && <Toast message={toast} />}
    </AppShell>
  );
}
