import api from './axios';
import { Workflow, ApiResponse, PaginatedResponse } from '../types';

export const workflowApi = {
  createWorkflow: (data: Partial<Workflow>) => 
    api.post<ApiResponse<Workflow>>('/workflows', data),
  
  getWorkflows: (page: number = 0, size: number = 10, search: string = '') => 
    api.get<ApiResponse<PaginatedResponse<Workflow>>>('/workflows', { params: { page, size, search } }),
  
  getWorkflowById: (id: string) => 
    api.get<ApiResponse<Workflow>>(`/workflows/${id}`),
  
  updateWorkflow: (id: string, data: Partial<Workflow>) => 
    api.put<ApiResponse<Workflow>>(`/workflows/${id}`, data),
  
  deleteWorkflow: (id: string) => 
    api.delete<ApiResponse<void>>(`/workflows/${id}`),
  
  executeWorkflow: (id: string, data: Record<string, any>) => 
    api.post<ApiResponse<any>>(`/workflows/${id}/execute`, data),
  
  simulateWorkflow: (id: string, initialData: Record<string, any>) =>
    api.post<ApiResponse<any>>(`/workflows/${id}/simulate`, initialData),
  
  validateWorkflow: (id: string) => 
    api.post<ApiResponse<{ valid: boolean; errors: string[] }>>(`/workflows/${id}/validate`),
  
  getWorkflowHealth: (id: string) => 
    api.get<ApiResponse<any>>(`/workflows/${id}/health`),
};

