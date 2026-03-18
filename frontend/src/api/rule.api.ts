import api from './axios';
import { Rule, ApiResponse } from '../types';

export const ruleApi = {
  createRule: (workflowId: string, stepId: string, data: Partial<Rule>) =>
    api.post<ApiResponse<Rule>>(`/workflows/${workflowId}/steps/${stepId}/rules`, data),
  
  getRules: (workflowId: string, stepId: string) =>
    api.get<ApiResponse<Rule[]>>(`/workflows/${workflowId}/steps/${stepId}/rules`),
  
  updateRule: (workflowId: string, stepId: string, ruleId: string, data: Partial<Rule>) =>
    api.put<ApiResponse<Rule>>(`/workflows/${workflowId}/steps/${stepId}/rules/${ruleId}`, data),
  
  deleteRule: (workflowId: string, stepId: string, ruleId: string) =>
    api.delete<ApiResponse<void>>(`/workflows/${workflowId}/steps/${stepId}/rules/${ruleId}`),
  
  validateCondition: (workflowId: string, stepId: string, data: { condition: string; testData: Record<string, any> }) =>
    api.post<ApiResponse<{ valid: boolean; result: boolean; message: string }>>(`/workflows/${workflowId}/steps/${stepId}/rules/validate`, data),
  
  reorderRules: (workflowId: string, stepId: string, data: { ruleIds: string[] }) =>
    api.put<ApiResponse<Rule[]>>(`/workflows/${workflowId}/steps/${stepId}/rules/reorder`, data),
  
  testCondition: (condition: string, testData: Record<string, any>) =>
    api.post<ApiResponse<{ valid: boolean; result: boolean; message: string }>>(`/rules/test-condition`, { condition, testData }),
};

