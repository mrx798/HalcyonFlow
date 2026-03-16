export interface Workflow {
  id: string;
  name: string;
  description: string;
  version: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  isActive: boolean;
  createdAt: string;
  stepCount: number;
}
