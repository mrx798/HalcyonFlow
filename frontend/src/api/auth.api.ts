import api from './axios';
import { AuthResponse, ApiResponse, User } from '../types';

export const authApi = {
  register: (data: any) => api.post<ApiResponse<AuthResponse>>('/auth/register', data),
  login: (data: any) => api.post<ApiResponse<AuthResponse>>('/auth/login', data),
  getCurrentUser: () => api.get<ApiResponse<User>>('/auth/me'),
  refreshToken: (data: any) => api.post<ApiResponse<AuthResponse>>('/auth/refresh', data),
};

