import { useAuth } from './auth/AuthContext';
import { LoginPage } from './auth/LoginPage';
import { PlayerApp } from './player/PlayerApp';
import { CoachApp } from './coach/CoachApp';
import { AdminApp } from './admin/AdminApp';

export function RootApp() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) return <LoginPage />;

  if (user.role === 'player') return <PlayerApp />;
  if (user.role === 'coach') return <CoachApp />;
  return <AdminApp />;
}
