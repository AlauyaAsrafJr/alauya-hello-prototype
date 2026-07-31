import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAuthToken } from '../api/client';

// Legacy key from a previous version that persisted sessions in localStorage.
// Cleared on startup so browsers with an old stored session don't skip the login screen.
const LEGACY_STORAGE_KEY = 'actibase.auth';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const loading = false;

  useEffect(() => {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }, []);

  async function login(username, password) {
    const res = await api.post('/auth/login', { username, password });
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
    const me = await api.get('/auth/me');
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
