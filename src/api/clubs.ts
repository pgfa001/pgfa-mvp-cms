import { apiFetch } from './client';
import type { SubscriptionType } from '../types/api';

export type ClubCmsResponse = {
  id: string;
  name: string;
  logoObjectKey?: string | null;
  accessCode: string;
  primaryColor: string;
  accentColor: string;
  subscriptionType: SubscriptionType;
  createdAt: number;
};

export type GetClubsResponse = {
  clubs: ClubCmsResponse[];
};

export type CreateClubRequest = {
  name: string;
  logoObjectKey?: string | null;
  accessCode: string;
  primaryColor: string;
  accentColor: string;
  subscriptionType: SubscriptionType;
};

export type UpdateClubRequest = CreateClubRequest;

export type CreateClubLogoUploadUrlResponse = {
  uploadIntentId: string;
  objectKey: string;
  uploadUrl: string;
  expiresAt: number;
};

export type GetClubLogoUrlResponse = {
  clubId: string;
  logoUrl: string;
  expiresAt: number;
};

export async function getClubs(token: string): Promise<GetClubsResponse> {
  return apiFetch<GetClubsResponse>('/clubs', {
    method: 'GET',
    token,
  });
}

export async function createClub(
  token: string,
  request: CreateClubRequest
): Promise<ClubCmsResponse> {
  return apiFetch<ClubCmsResponse>('/clubs', {
    method: 'POST',
    token,
    body: JSON.stringify(request),
  });
}

export async function updateClub(
  token: string,
  clubId: string,
  request: UpdateClubRequest
): Promise<ClubCmsResponse> {
  return apiFetch<ClubCmsResponse>(`/clubs/${clubId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(request),
  });
}

export async function deleteClub(
  token: string,
  clubId: string
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/clubs/${clubId}`, {
    method: 'DELETE',
    token,
  });
}

export async function createClubLogoUploadUrl(
  token: string,
  fileName: string,
  contentType: string
): Promise<CreateClubLogoUploadUrlResponse> {
  return apiFetch<CreateClubLogoUploadUrlResponse>('/clubs/logo-upload-url', {
    method: 'POST',
    token,
    body: JSON.stringify({ fileName, contentType }),
  });
}

export async function getClubLogoUrl(
  token: string,
  clubId: string
): Promise<GetClubLogoUrlResponse> {
  return apiFetch<GetClubLogoUrlResponse>(`/clubs/${clubId}/logo-url`, {
    method: 'GET',
    token,
  });
}