import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import * as api from '../lib/api';
import type { UserSession } from '../types';

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (key: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

function getStoredToken(): string | null {
  return localStorage.getItem('moragas-token');
}

function storeToken(token: string) {
  localStorage.setItem('moragas-token', token);
}

function clearToken() {
  localStorage.removeItem('moragas-token');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const validateSession = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const session = await api.me(token);
      setUser(session);
    } catch {
      clearToken();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  const login = async (key: string) => {
    const session = await api.login(key);
    storeToken(session.token);
    setUser(session);
  };

  const logout = async () => {
    const token = getStoredToken();
    if (token) {
      try {
        await api.logout(token);
      } catch {
        // ignore
      }
    }
    clearToken();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
