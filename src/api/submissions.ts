import { apiFetch } from './client';

export type SubmissionValidationStatus =
  | 'NOT_VALIDATED'
  | 'VALIDATED'
  | 'INVALID';

export type ChallengeReviewSubmissionItemResponse = {
  submissionId: string;
  rank: number;
  athleteId: string;
  athleteName: string;
  teamId: string;
  teamName: string;
  score: number;
  validationStatus: SubmissionValidationStatus;
  createdAt: number;
};

export type GetChallengeReviewSubmissionsResponse = {
  challengeId: string;
  challengeTitle: string;
  submissions: ChallengeReviewSubmissionItemResponse[];
};

export type ChallengeSubmissionDetailsResponse = {
  submissionId: string;
  challengeId: string;
  challengeTitle: string;
  athleteId: string;
  athleteName: string;
  teamId: string;
  teamName: string;
  score: number;
  validationStatus: SubmissionValidationStatus;
  createdAt: number;
  videoUrl: string;
  videoUrlExpiresAt: number;
  validatedBy?: string | null;
  validatedAt?: number | null;
};

export type VerifyChallengeSubmissionRequest = {
  validationStatus: SubmissionValidationStatus;
};

export type VerifyChallengeSubmissionResponse = {
  submissionId: string;
  validationStatus: SubmissionValidationStatus;
};

export async function getChallengeReviewSubmissions(
  token: string,
  challengeId: string,
  clubId?: string,
  teamId?: string,
  limit?: number
): Promise<GetChallengeReviewSubmissionsResponse> {
  const params = new URLSearchParams();

  if (clubId) {
    params.set('clubId', clubId);
  }

  if (teamId) {
    params.set('teamId', teamId);
  }

  if (limit) {
    params.set('limit', String(limit));
  }

  const query = params.toString() ? `?${params.toString()}` : '';

  return apiFetch<GetChallengeReviewSubmissionsResponse>(
    `/challenges/${challengeId}/review-submissions${query}`,
    {
      method: 'GET',
      token,
    }
  );
}

export async function getSubmissionDetails(
  token: string,
  submissionId: string
): Promise<ChallengeSubmissionDetailsResponse> {
  return apiFetch<ChallengeSubmissionDetailsResponse>(
    `/challenge-submissions/${submissionId}`,
    {
      method: 'GET',
      token,
    }
  );
}

export async function verifySubmission(
  token: string,
  submissionId: string,
  request: VerifyChallengeSubmissionRequest
): Promise<VerifyChallengeSubmissionResponse> {
  return apiFetch<VerifyChallengeSubmissionResponse>(
    `/challenge-submissions/${submissionId}/verify`,
    {
      method: 'POST',
      token,
      body: JSON.stringify(request),
    }
  );
}
