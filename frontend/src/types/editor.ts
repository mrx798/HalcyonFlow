import { Node, Edge } from 'reactflow';

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
