import api from './axios';
import { Step, ApiResponse } from '../types';

export const stepApi = {
  createStep: (workflowId: string, data: Partial<Step>) => 
    api.post<ApiResponse<Step>>(`/workflows/${workflowId}/steps`, data),
  
  getSteps: (workflowId: string) => 
    api.get<ApiResponse<Step[]>>(`/workflows/${workflowId}/steps`),
  
  updateStep: (workflowId: string, stepId: string, data: Partial<Step>) => 
    api.put<ApiResponse<Step>>(`/workflows/${workflowId}/steps/${stepId}`, data),
  
  deleteStep: (workflowId: string, stepId: string) => 
    api.delete<ApiResponse<void>>(`/workflows/${workflowId}/steps/${stepId}`),
  
  reorderSteps: (workflowId: string, data: { stepIds: string[] }) => 
    api.put<ApiResponse<Step[]>>(`/workflows/${workflowId}/steps/reorder`, data),
};

