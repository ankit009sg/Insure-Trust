import { apiClient } from './client';
import { TokenResponse, User } from '../types';

export const authApi = {
  async register(email: string, password: string, role: string): Promise<User> {
    const response = await apiClient.post<User>('/api/v1/auth/register', {
      email,
      password,
      role,
    });
    return response.data;
  },

  async login(email: string, password: string): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/api/v1/auth/login-json', {
      email,
      password,
    });
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<User>('/api/v1/auth/me');
    return response.data;
  },
};
