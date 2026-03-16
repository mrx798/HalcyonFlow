import api from './axios';

export const stepApi = {
  createStep: (workflowId: string, data: any) => api.post(`/workflows/${workflowId}/steps`, data),
  getSteps: (workflowId: string) => api.get(`/workflows/${workflowId}/steps`),
  updateStep: (workflowId: string, stepId: string, data: any) => api.put(`/workflows/${workflowId}/steps/${stepId}`, data),
  deleteStep: (workflowId: string, stepId: string) => api.delete(`/workflows/${workflowId}/steps/${stepId}`),
  reorderSteps: (workflowId: string, data: any) => api.put(`/workflows/${workflowId}/steps/reorder`, data),
};
