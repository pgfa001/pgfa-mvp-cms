import {
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { login as loginApi } from '../api/auth';
import type { LoginResponse } from '../types/api';
import {
  AUTH_STORAGE_KEY,
  AuthContext,
  isCmsRole,
  withResolvedClubScope,
} from './auth-context';
import type { AuthContextValue } from './auth-context';

function getStoredAuth() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as LoginResponse;
    return isCmsRole(parsed.role) ? withResolvedClubScope(parsed) : null;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<LoginResponse | null>(getStoredAuth);

  const value = useMemo<AuthContextValue>(
    () => ({
      auth,
      isAuthenticated: !!auth,
      login: async (username: string, password: string) => {
        const response = await loginApi({ username, password });

        if (!isCmsRole(response.role)) {
          throw new Error('Only superadmins, admins, and coaches can access the CMS.');
        }

        const resolvedResponse = withResolvedClubScope(response);

        setAuth(resolvedResponse);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(resolvedResponse));
        return resolvedResponse;
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
