import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../auth/AuthContext';
import { DashboardIcon, PlayersIcon, AttendanceIcon, ActivitiesIcon, StarIcon, ReportsIcon } from '../icons';
import { DashboardPage } from './pages/DashboardPage';
import { PlayersPage } from './pages/PlayersPage';
import { AttendancePage } from './pages/AttendancePage';
import { TrainingActivitiesPage } from './pages/TrainingActivitiesPage';
import { PerformanceFeedbackPage } from './pages/PerformanceFeedbackPage';
import { ReportsPage } from './pages/ReportsPage';

type CoachPageKey = 'dashboard' | 'players' | 'attendance' | 'activities' | 'feedback' | 'reports';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { key: 'players', label: 'Manage Players', icon: PlayersIcon },
  { key: 'attendance', label: 'Attendance', icon: AttendanceIcon },
  { key: 'activities', label: 'Training Activities', icon: ActivitiesIcon },
  { key: 'feedback', label: 'Performance Feedback', icon: StarIcon },
  { key: 'reports', label: 'Analytics & Reports', icon: ReportsIcon },
];

const PAGE_TITLES: Record<CoachPageKey, [string, string]> = {
  dashboard: ['Dashboard', 'Team overview across attendance, activities, and performance'],
  players: ['Manage Players', 'View and update varsity player profiles'],
  attendance: ['Attendance', 'Record and review player attendance'],
  activities: ['Training Activities', 'Log and edit training sessions and participation'],
  feedback: ['Performance Feedback', 'Submit and review player performance evaluations'],
  reports: ['Analytics & Reports', 'Team analytics and generated reports'],
};

export function CoachApp() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState<CoachPageKey>('dashboard');
  const { toast, showToast } = useToast();

  if (!user) return null;
  const [pageTitle, pageSubtitle] = PAGE_TITLES[page];

  return (
    <AppShell
      items={NAV_ITEMS}
      active={page}
      onNavigate={(key) => setPage(key as CoachPageKey)}
      onLogout={logout}
      roleLabel="Coach"
      displayName={user.display_name}
      pageTitle={pageTitle}
      pageSubtitle={pageSubtitle}
      onAccountSettings={() => setPage('dashboard')}
    >
      {page === 'dashboard' && <DashboardPage onNavigate={(k) => setPage(k as CoachPageKey)} />}
      {page === 'players' && <PlayersPage showToast={showToast} />}
      {page === 'attendance' && <AttendancePage showToast={showToast} />}
      {page === 'activities' && <TrainingActivitiesPage showToast={showToast} />}
      {page === 'feedback' && <PerformanceFeedbackPage showToast={showToast} />}
      {page === 'reports' && <ReportsPage showToast={showToast} />}

      {toast && <Toast message={toast} />}
    </AppShell>
  );
}
