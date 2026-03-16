export interface DashboardStats {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  executionsToday: number;
  successRate: number;
  pendingApprovals: number;
  recentExecutions: ExecutionSummary[];
}

export interface ExecutionSummary {
  id: string;
  workflowId: string;
  workflowName: string;
  status: string;
  triggeredByName: string;
  startedAt: string;
  endedAt?: string;
  duration?: string;
  createdAt: string;
}
