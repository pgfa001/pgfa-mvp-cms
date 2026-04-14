import { apiFetch } from './client';
import type { SubscriptionType } from '../types/api';

export type ClubSummaryResponse = {
  id: string;
  name: string;
  logoUrl: string;
  accessCode: string;
  primaryColor: string;
  accentColor: string;
  subscriptionType: SubscriptionType;
  createdAt: number;
};

export type GetClubsResponse = {
  clubs: ClubSummaryResponse[];
};

export async function getClubs(token: string): Promise<GetClubsResponse> {
  return apiFetch<GetClubsResponse>('/clubs', {
    method: 'GET',
    token,
  });
}