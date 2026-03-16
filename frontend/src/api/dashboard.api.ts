import api from './axios';

export const dashboardApi = {
  getDashboardStats: () => api.get('/dashboard/stats'),
  getRecentExecutions: () => api.get('/dashboard/recent-executions'),
};
