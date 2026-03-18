import api from './axios';

export const ruleApi = {
  createRule: (workflowId: string, stepId: string, data: any) =>
    api.post(`/workflows/${workflowId}/steps/${stepId}/rules`, data),
  getRules: (workflowId: string, stepId: string) =>
    api.get(`/workflows/${workflowId}/steps/${stepId}/rules`),
  updateRule: (workflowId: string, stepId: string, ruleId: string, data: any) =>
    api.put(`/workflows/${workflowId}/steps/${stepId}/rules/${ruleId}`, data),
  deleteRule: (workflowId: string, stepId: string, ruleId: string) =>
    api.delete(`/workflows/${workflowId}/steps/${stepId}/rules/${ruleId}`),
  validateCondition: (workflowId: string, stepId: string, data: any) =>
    api.post(`/workflows/${workflowId}/steps/${stepId}/rules/validate`, data),
  reorderRules: (workflowId: string, stepId: string, data: { ruleIds: string[] }) =>
    api.put(`/workflows/${workflowId}/steps/${stepId}/rules/reorder`, data),
  testCondition: (condition: string, testData: any) =>
    api.post(`/rules/test-condition`, { condition, testData }),
};
