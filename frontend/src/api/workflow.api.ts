import api from './axios';

export const workflowApi = {
  createWorkflow: (data: any) => api.post('/workflows', data),
  getWorkflows: () => api.get('/workflows'),
  getWorkflowById: (id: string) => api.get(`/workflows/${id}`),
  updateWorkflow: (id: string, data: any) => api.put(`/workflows/${id}`, data),
  deleteWorkflow: (id: string) => api.delete(`/workflows/${id}`),
  executeWorkflow: (id: string, data: any) => api.post(`/workflows/${id}/execute`, data),
  validateWorkflow: (id: string) => api.post(`/workflows/${id}/validate`),
};
