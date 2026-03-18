import api from './axios';
import { Execution, ApiResponse } from '../types';

export const executionApi = {
  getExecutionsByWorkflow: (workflowId: string) => 
    api.get<ApiResponse<Execution[]>>(`/executions/workflow/${workflowId}`),
  
  startExecution: (workflowId: string, data: { inputData: Record<string, any> }) =>
    api.post<ApiResponse<Execution>>('/executions', { workflowId, ...data }),
  
  getExecutions: () => api.get<ApiResponse<Execution[]>>('/executions'),
  
  getExecution: (id: string) => api.get<ApiResponse<Execution>>(`/executions/${id}`),
  
  cancelExecution: (id: string) => api.post<ApiResponse<void>>(`/executions/${id}/cancel`),
  
  retryExecution: (id: string) => api.post<ApiResponse<Execution>>(`/executions/${id}/retry`),
  
  resumeExecution: (id: string, data: Record<string, any>) => 
    api.post<ApiResponse<Execution>>(`/executions/${id}/resume`, data),
};

