import { apiFetch } from './client';
import type { UserRole } from '../types/api';

export type UserSearchResult = {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  position?: string | null;
  clubIds: string[];
  teamIds?: string[];
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

export type ResetUserPasswordRequest = {
  password?: string;
};

export type ResetUserPasswordResponse = {
  userId: string;
  username: string;
  temporaryPassword: string;
  message: string;
};

export type UserManagementResponse = {
  userId: string;
  username: string;
  clubIds: string[];
  teamIds: string[];
  message: string;
};

export type CreateSuperAdminRequest = {
  name: string;
  username: string;
  password: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  state: string;
  town: string;
  socialMediaHandle: string;
};

export type CreateSuperAdminResponse = UserSearchResult & {
  role: 'SUPERADMIN';
};

export type CmsCreatableUserRole = 'ATHLETE' | 'COACH' | 'PARENT';

export type CreateCmsChildAthleteRequest = {
  name: string;
  username: string;
  password: string;
  dob: string;
  gender: string;
  position: string;
  teamIds: string[];
};

export type CreateCmsUserRequest = {
  clubId: string;
  name: string;
  username: string;
  password: string;
  role: CmsCreatableUserRole;
  dob: string;
  email?: string;
  phone?: string;
  gender?: string;
  position?: string;
  teamIds?: string[];
  childAccounts?: CreateCmsChildAthleteRequest[];
};

export type CreateCmsUserResponse = UserSearchResult;

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

export async function resetUserPassword(
  token: string,
  userId: string,
  request: ResetUserPasswordRequest
): Promise<ResetUserPasswordResponse> {
  return apiFetch<ResetUserPasswordResponse>(
    `/users/${userId}/reset-password`,
    {
      method: 'POST',
      token,
      body: JSON.stringify(request),
    }
  );
}

export async function updateUserUsername(
  token: string,
  userId: string,
  username: string
): Promise<UserManagementResponse> {
  return apiFetch<UserManagementResponse>(`/users/${userId}/username`, {
    method: 'PUT',
    token,
    body: JSON.stringify({ username }),
  });
}

export async function updateUserClub(
  token: string,
  userId: string,
  clubIdOrIds: string | string[]
): Promise<UserManagementResponse> {
  return apiFetch<UserManagementResponse>(`/users/${userId}/club`, {
    method: 'PUT',
    token,
    body: JSON.stringify(
      Array.isArray(clubIdOrIds)
        ? { clubIds: clubIdOrIds }
        : { clubId: clubIdOrIds }
    ),
  });
}

export async function updateUserTeams(
  token: string,
  userId: string,
  teamIds: string[]
): Promise<UserManagementResponse> {
  return apiFetch<UserManagementResponse>(`/users/${userId}/teams`, {
    method: 'PUT',
    token,
    body: JSON.stringify({ teamIds }),
  });
}

export async function deleteUser(
  token: string,
  userId: string
): Promise<UserManagementResponse> {
  return apiFetch<UserManagementResponse>(`/users/${userId}`, {
    method: 'DELETE',
    token,
  });
}

export async function createSuperAdmin(
  token: string,
  request: CreateSuperAdminRequest
): Promise<CreateSuperAdminResponse> {
  return apiFetch<CreateSuperAdminResponse>('/users/superadmins', {
    method: 'POST',
    token,
    body: JSON.stringify(request),
  });
}

export async function createCmsUser(
  token: string,
  request: CreateCmsUserRequest
): Promise<CreateCmsUserResponse> {
  return apiFetch<CreateCmsUserResponse>('/users', {
    method: 'POST',
    token,
    body: JSON.stringify(request),
  });
}
