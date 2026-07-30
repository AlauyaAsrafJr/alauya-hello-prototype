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

export interface RegisterPlayerForm {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  email: string;
  contact_number?: string;
  date_of_birth?: string;
  team?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  registerPlayer: (form: RegisterPlayerForm) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const STORAGE_KEY = 'actibase.auth';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { token, user: storedUser } = JSON.parse(stored);
        setAuthToken(token);
        setUser(storedUser);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  async function login(username: string, password: string) {
    const res = await api.post<LoginResponse>('/auth/login', { username, password });
    setAuthToken(res.access_token);
    setUser(res.user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: res.access_token, user: res.user }));
  }

  async function registerPlayer(form: RegisterPlayerForm) {
    await api.post('/auth/register', form);
    await login(form.username, form.password);
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // token may already be invalid/expired; proceed with local logout regardless
    }
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  async function refreshUser() {
    const me = await api.get<AuthUser & { last_login: string | null }>('/auth/me');
    setUser(me);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, user: me }));
    }
  }

  const value = useMemo(
    () => ({ user, loading, login, registerPlayer, logout, refreshUser }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
