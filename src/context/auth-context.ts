import { createContext, useContext } from 'react';
import type { LoginResponse, UserRole } from '../types/api';

export type AuthContextValue = {
  auth: LoginResponse | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
};

export const AUTH_STORAGE_KEY = 'cms_auth';
export const ADMIN_CLUB_STORAGE_KEY = 'cms_admin_clubs';

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function isCmsRole(role: UserRole) {
  return role === 'SUPERADMIN' || role === 'ADMIN' || role === 'COACH';
}

function parseStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function decodeJwtPayload(token: string) {
  const payload = token.split('.')[1];
  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

type StoredAdminClub = {
  clubId: string;
  clubName?: string | null;
};

function getStoredAdminClub(username: string): StoredAdminClub | null {
  const raw = localStorage.getItem(ADMIN_CLUB_STORAGE_KEY);
  if (!raw) return null;

  try {
    const mappings = JSON.parse(raw) as Record<string, string | StoredAdminClub>;
    const mapping = mappings[username];

    if (!mapping) return null;
    if (typeof mapping === 'string') return { clubId: mapping };

    return mapping;
  } catch {
    localStorage.removeItem(ADMIN_CLUB_STORAGE_KEY);
    return null;
  }
}

export function rememberAdminClub(
  username: string,
  clubId: string,
  clubName: string
) {
  const raw = localStorage.getItem(ADMIN_CLUB_STORAGE_KEY);
  const mappings = raw
    ? (JSON.parse(raw) as Record<string, string | StoredAdminClub>)
    : {};

  mappings[username] = { clubId, clubName };
  localStorage.setItem(ADMIN_CLUB_STORAGE_KEY, JSON.stringify(mappings));
}

export function withResolvedClubScope(response: LoginResponse): LoginResponse {
  const payload = decodeJwtPayload(response.token);
  const jwtClubId =
    payload?.clubId ||
    payload?.club_id ||
    payload?.assignedClubId ||
    payload?.assigned_club_id;
  const jwtClubName =
    payload?.clubName ||
    payload?.club_name ||
    payload?.assignedClubName ||
    payload?.assigned_club_name;

  const jwtClubIds = [
    ...parseStringArray(payload?.clubIds),
    ...parseStringArray(payload?.club_ids),
    ...parseStringArray(payload?.assignedClubIds),
    ...parseStringArray(payload?.assigned_club_ids),
  ];

  const storedClub =
    response.role === 'ADMIN' ? getStoredAdminClub(response.username) : null;

  return {
    ...response,
    clubId:
      response.clubId ||
      (typeof jwtClubId === 'string' ? jwtClubId : null) ||
      storedClub?.clubId ||
      null,
    clubName:
      response.clubName ||
      (typeof jwtClubName === 'string' ? jwtClubName : null) ||
      storedClub?.clubName ||
      null,
    clubIds: response.clubIds?.length ? response.clubIds : jwtClubIds,
  };
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
