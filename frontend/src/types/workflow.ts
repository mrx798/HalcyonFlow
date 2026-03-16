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
}
