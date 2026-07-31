import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../auth/AuthContext';
import { AttendanceIcon, NoteIcon, ProfileIcon, ReportsIcon, SessionsIcon, ActivitiesIcon } from '../icons';
import { ProfilePage } from './pages/ProfilePage';
import { AttendancePage } from './pages/AttendancePage';
import { ParticipationPage } from './pages/ParticipationPage';
import { TrainingActivityPage } from './pages/TrainingActivityPage';
import { PerformanceFeedbackPage } from './pages/PerformanceFeedbackPage';
import { NotesPage } from './pages/NotesPage';

const NAV_ITEMS = [
  { key: 'profile', label: 'My Profile', icon: ProfileIcon, group: 'Overview' },
  { key: 'attendance', label: 'Attendance', icon: AttendanceIcon, group: 'My Records' },
  { key: 'participation', label: 'Participation History', icon: SessionsIcon, group: 'My Records' },
  { key: 'training', label: 'Training Activity', icon: ActivitiesIcon, group: 'My Records' },
  { key: 'feedback', label: 'Performance Feedback', icon: ReportsIcon, group: 'My Records' },
  { key: 'notes', label: 'My Notes', icon: NoteIcon, group: 'Personal' },
];

const PAGE_TITLES = {
  profile: ['My Profile', 'View your player information and personal statistics'],
  attendance: ['Attendance', 'Your attendance record across training sessions'],
  participation: ['Participation History', 'Training activities you have joined'],
  training: ['Training Activity', 'Training sessions logged by your coaches'],
  feedback: ['Performance Feedback', 'Feedback and ratings submitted by your coaches'],
  notes: ['My Notes', 'Personal notes about your training and progress'],
};

export function PlayerApp() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState('profile');
  const { toast, showToast } = useToast();

  if (!user) return null;
  const [pageTitle, pageSubtitle] = PAGE_TITLES[page];

  return (
    <AppShell
      items={NAV_ITEMS}
      active={page}
      onNavigate={(key) => setPage(key)}
      onLogout={logout}
      roleLabel="Varsity Player"
      displayName={user.display_name}
      pageTitle={pageTitle}
      pageSubtitle={pageSubtitle}
      onAccountSettings={() => setPage('profile')}
    >
      {page === 'profile' && <ProfilePage showToast={showToast} />}
      {page === 'attendance' && <AttendancePage />}
      {page === 'participation' && <ParticipationPage />}
      {page === 'training' && <TrainingActivityPage />}
      {page === 'feedback' && <PerformanceFeedbackPage />}
      {page === 'notes' && <NotesPage showToast={showToast} />}

      {toast && <Toast message={toast} />}
    </AppShell>
  );
}
