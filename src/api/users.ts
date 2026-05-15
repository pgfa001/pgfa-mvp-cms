import { apiFetch } from './client';
import type { UserRole } from '../types/api';

export type UserSearchResult = {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  email: string;
  phone: string;
  avatarUrl?: string | null;
  position?: string | null;
  clubIds: string[];
};

export type SearchUsersRequest = {
  query?: string;
  clubId?: string;
  role?: UserRole;
  limit?: number;
};

export type SearchUsersResponse = {
  query: string;
  limit: number;
  users: UserSearchResult[];
};

export async function searchUsers(
  token: string,
  request: SearchUsersRequest
): Promise<SearchUsersResponse> {
  const params = new URLSearchParams();

  if (request.query?.trim()) {
    params.set('query', request.query.trim());
  }

  if (request.clubId) {
    params.set('clubId', request.clubId);
  }

  if (request.role) {
    params.set('role', request.role);
  }

  if (request.limit) {
    params.set('limit', String(request.limit));
  }

  const query = params.toString() ? `?${params.toString()}` : '';

  return apiFetch<SearchUsersResponse>(`/users/search${query}`, {
    method: 'GET',
    token,
  });
}
