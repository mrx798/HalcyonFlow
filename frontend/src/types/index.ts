import { Node, Edge } from 'reactflow';

/* ─────────────────────────────────── COMMON ─────────────────────────────────── */

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  pageable: {
    offset: number;
  };
}

/* ─────────────────────────────────── AUTH ─────────────────────────────────── */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId?: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

/* ────────────────────────────────── WORKFLOW ────────────────────────────────── */

export interface Workflow {
  id: string;
  name: string;
  description: string;
  version: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  isActive: boolean;
  inputSchema: Record<string, any>;
  startStepId?: string;
  createdAt: string;
  stepCount: number;
  totalExecutions?: number;
  successRate?: number;
  averageDuration?: string;
}

export interface Step {
  id: string;
  workflowId: string;
  name: string;
  stepType: 'TASK' | 'APPROVAL' | 'NOTIFICATION';
  orderIndex: number;
  config: Record<string, any>;
  metadata?: Record<string, any>;
}


export interface Rule {
  id: string;
  stepId: string;
  condition: string;
  priority: number;
  nextStepId?: string;
  isDefault: boolean;
}

/* ───────────────────────────────── EXECUTION ───────────────────────────────── */

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
  status?: string;
  startedAt?: string;
  endedAt?: string;
  started_at?: string;
  ended_at?: string;
}

/* ────────────────────────────────── DASHBOARD ────────────────────────────────── */

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

/* ─────────────────────────────────── EDITOR ─────────────────────────────────── */

export interface WorkflowNodeData {
  id: string;
  label: string;
  type: 'TASK' | 'APPROVAL' | 'NOTIFICATION';
  metadata: Record<string, any>;
  isNew?: boolean;
  onEdit: (data: any) => void;
}

export type AppNode = Node<WorkflowNodeData>;
export type AppEdge = Edge;
