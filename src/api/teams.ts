import { apiFetch } from './client';

export type TeamResponse = {
  id: string;
  name: string;
  clubId: string;
  clubName?: string;
  club?: {
    id: string;
    name: string;
  };
  lowerAgeRange: number;
  upperAgeRange: number;
  createdAt: number;
};

export type GetTeamsResponse = {
  teams: TeamResponse[];
};

export type CreateTeamRequest = {
  name: string;
  clubId: string;
  lowerAgeRange: number;
  upperAgeRange: number;
};

export type UpdateTeamRequest = {
  name: string;
  clubId: string;
  lowerAgeRange: number;
  upperAgeRange: number;
};

export async function getTeams(token: string): Promise<GetTeamsResponse> {
  return apiFetch<GetTeamsResponse>('/teams', {
    method: 'GET',
    token,
  });
}

export async function createTeam(
  token: string,
  request: CreateTeamRequest
): Promise<TeamResponse> {
  return apiFetch<TeamResponse>('/teams', {
    method: 'POST',
    token,
    body: JSON.stringify(request),
  });
}

export async function updateTeam(
  token: string,
  teamId: string,
  request: UpdateTeamRequest
): Promise<TeamResponse> {
  return apiFetch<TeamResponse>(`/teams/${teamId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(request),
  });
}
