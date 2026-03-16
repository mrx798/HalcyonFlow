export interface Execution {
  id: string;
  workflowId: string;
  workflowName: string;
  workflowVersion: number;
  status: 'PENDING' | 'RUNNING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PAUSED' | 'CANCELLED';
  currentStepId?: string;
  currentStepName?: string;
  inputData: Record<string, any>;
  contextData: Record<string, any>;
  logs: ExecutionLog[];
  startedAt: string;
  endedAt?: string;
  duration?: string;
}

export interface ExecutionLog {
  id: string;
  stepName?: string;
  action: string;
  details: string;
  timestamp: string;
}
