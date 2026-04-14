import { apiFetch } from './client';
import type { LoginRequest, LoginResponse } from '../types/api';

export async function login(request: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}