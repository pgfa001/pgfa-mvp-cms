import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { login as loginApi } from '../api/auth';
import type { LoginResponse } from '../types/api';

type AuthContextValue = {
  auth: LoginResponse | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = 'cms_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<LoginResponse | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as LoginResponse;
      setAuth(parsed);
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      auth,
      isAuthenticated: !!auth,
      login: async (username: string, password: string) => {
        const response = await loginApi({ username, password });

        if (response.role !== 'ADMIN' && response.role !== 'COACH') {
          throw new Error('Only admins and coaches can access the CMS.');
        }

        setAuth(response);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response));
        return response;
      },
      logout: () => {
        setAuth(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      },
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}