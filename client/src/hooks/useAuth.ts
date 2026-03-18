import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import api from '@/services/api';
import type { User, LoginResponse, MeResponse } from '@/types/auth';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchCompany: (companyId: number) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    api
      .get<MeResponse>('/auth/me')
      .then((res) => {
        setUser(res.data.data);
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    const { accessToken, user: userData } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout API errors
    }
    localStorage.removeItem('accessToken');
    setUser(null);
  }, []);

  const switchCompany = useCallback((companyId: number) => {
    // Update x-company-id for subsequent API calls
    api.defaults.headers.common['x-company-id'] = companyId;
    localStorage.setItem('selectedCompanyId', String(companyId));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      switchCompany,
    }),
    [user, isLoading, login, logout, switchCompany],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
