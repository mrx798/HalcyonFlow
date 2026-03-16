import api from './axios';

export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: (data: any) => api.post('/auth/refresh', data),
};
