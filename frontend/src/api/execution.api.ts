import api from './axios';

export const executionApi = {
  startExecution: (workflowId: string, data: { inputData: Record<string, any> }) =>
    api.post('/executions', { workflowId, ...data }),
  getExecution: (id: string) => api.get(`/executions/${id}`),
  cancelExecution: (id: string) => api.post(`/executions/${id}/cancel`),
  retryExecution: (id: string) => api.post(`/executions/${id}/retry`),
  resumeExecution: (id: string, data: any) => api.post(`/executions/${id}/resume`, data),
};
