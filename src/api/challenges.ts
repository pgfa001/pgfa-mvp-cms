import { apiFetch } from './client';

export type ChallengeScoringType =
  | 'HIGH_SCORE'
  | 'LOW_SCORE'
  | 'FASTEST_TIME'
  | 'LONGEST_TIME';

export type ChallengeCmsResponse = {
  id: string;
  title: string;
  description: string;
  demoVideoObjectKey?: string | null;
  scoringType: ChallengeScoringType;
  difficulty: number;
  startTime: number;
  endTime: number;
  createdBy: string;
  createdAt: number;
  clubIds: string[];
};

export type GetChallengesCmsResponse = {
  challenges: ChallengeCmsResponse[];
};

export type CreateChallengeCmsRequest = {
  title: string;
  description: string;
  demoVideoObjectKey?: string | null;
  scoringType: ChallengeScoringType;
  difficulty: number;
  startTime: number;
  endTime: number;
  clubIds: string[];
};

export type UpdateChallengeCmsRequest = {
  title: string;
  description: string;
  demoVideoObjectKey?: string | null;
  scoringType: ChallengeScoringType;
  difficulty: number;
  startTime: number;
  endTime: number;
  clubIds: string[];
};

export type CreateChallengeDemoUploadUrlRequest = {
  fileName: string;
  contentType: string;
};

export type CreateChallengeDemoUploadUrlResponse = {
  uploadIntentId: string;
  objectKey: string;
  uploadUrl: string;
  expiresAt: number;
};

export type GetChallengeDemoVideoUrlResponse = {
  challengeId: string;
  videoUrl: string;
  expiresAt: number;
};

export async function getChallenges(
  token: string
): Promise<GetChallengesCmsResponse> {
  return apiFetch<GetChallengesCmsResponse>('/challenges', {
    method: 'GET',
    token,
  });
}

export async function createChallenge(
  token: string,
  request: CreateChallengeCmsRequest
): Promise<ChallengeCmsResponse> {
  return apiFetch<ChallengeCmsResponse>('/challenges', {
    method: 'POST',
    token,
    body: JSON.stringify(request),
  });
}

export async function updateChallenge(
  token: string,
  challengeId: string,
  request: UpdateChallengeCmsRequest
): Promise<ChallengeCmsResponse> {
  return apiFetch<ChallengeCmsResponse>(`/challenges/${challengeId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(request),
  });
}

export async function createChallengeDemoUploadUrl(
  token: string,
  request: CreateChallengeDemoUploadUrlRequest
): Promise<CreateChallengeDemoUploadUrlResponse> {
  return apiFetch<CreateChallengeDemoUploadUrlResponse>(
    '/challenges/demo-upload-url',
    {
      method: 'POST',
      token,
      body: JSON.stringify(request),
    }
  );
}

export async function getChallengeDemoVideoUrl(
  token: string,
  challengeId: string
): Promise<GetChallengeDemoVideoUrlResponse> {
  return apiFetch<GetChallengeDemoVideoUrlResponse>(
    `/challenges/${challengeId}/demo-video-url`,
    {
      method: 'GET',
      token,
    }
  );
}
