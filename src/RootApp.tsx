import { useState } from 'react';
import { useAuth } from './auth/AuthContext';
import { LoginPage } from './auth/LoginPage';
import { RegisterPage } from './auth/RegisterPage';
import { PlayerApp } from './player/PlayerApp';
import { CoachApp } from './coach/CoachApp';
import { AdminApp } from './admin/AdminApp';

export function RootApp() {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  if (loading) return null;

  if (!user) {
    return authView === 'login' ? (
      <LoginPage onGoRegister={() => setAuthView('register')} />
    ) : (
      <RegisterPage onGoLogin={() => setAuthView('login')} />
    );
  }

  if (user.role === 'player') return <PlayerApp />;
  if (user.role === 'coach') return <CoachApp />;
  return <AdminApp />;
}
