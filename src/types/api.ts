export type UserRole = 'ATHLETE' | 'PARENT' | 'COACH' | 'ADMIN';

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
  hasAcceptedRequiredConsents: boolean;
};