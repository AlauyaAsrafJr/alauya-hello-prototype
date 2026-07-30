import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setAuthToken } from '../api/client';
import type { AdminProfile, CoachProfile, PlayerProfile, UserRole } from '../api/domain';

export interface AuthUser {
  user_id: number;
  username: string;
  role: UserRole;
  display_name: string;
  profile: PlayerProfile | CoachProfile | AdminProfile | null;
}

interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Legacy key from a previous version that persisted sessions in localStorage.
// Cleared on startup so browsers with an old stored session don't skip the login screen.
const LEGACY_STORAGE_KEY = 'actibase.auth';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const loading = false;

  useEffect(() => {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }, []);

  async function login(username: string, password: string) {
    const res = await api.post<LoginResponse>('/auth/login', { username, password });
    setAuthToken(res.access_token);
    setUser(res.user);
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // token may already be invalid/expired; proceed with local logout regardless
    }
    setAuthToken(null);
    setUser(null);
  }

  async function refreshUser() {
    const me = await api.get<AuthUser & { last_login: string | null }>('/auth/me');
    setUser(me);
  }

  const value = useMemo(() => ({ user, loading, login, logout, refreshUser }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
