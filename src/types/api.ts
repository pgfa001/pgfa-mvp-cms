export type UserRole = 'ATHLETE' | 'PARENT' | 'COACH' | 'ADMIN' | 'SUPERADMIN';

export type SubscriptionType = 'CLUB_PAID' | 'ATHLETE_PAID';

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  userId: string;
  username: string;
  role: UserRole;
  clubId: string | null;
  clubName?: string | null;
  clubIds?: string[] | null;
  assignedClubIds?: string[] | null;
  hasAcceptedRequiredConsents: boolean;
};
