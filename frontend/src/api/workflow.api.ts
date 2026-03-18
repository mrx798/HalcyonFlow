import api from './axios';

export const workflowApi = {
  createWorkflow: (data: any) => api.post('/workflows', data),
  getWorkflows: (page: number = 0, size: number = 10, search: string = '') => 
    api.get('/workflows', { params: { page, size, search } }),
  getWorkflowById: (id: string) => api.get(`/workflows/${id}`),
  updateWorkflow: (id: string, data: any) => api.put(`/workflows/${id}`, data),
  deleteWorkflow: (id: string) => api.delete(`/workflows/${id}`),
  executeWorkflow: (id: string, data: any) => api.post(`/workflows/${id}/execute`, data),
  simulateWorkflow: (id: string, initialData: any) =>
    api.post(`/workflows/${id}/simulate`, initialData),
  validateWorkflow: (id: string) => api.post(`/workflows/${id}/validate`),
  getWorkflowHealth: (id: string) => api.get(`/workflows/${id}/health`),
};
