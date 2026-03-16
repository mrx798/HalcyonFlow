import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  applyEdgeChanges, 
  applyNodeChanges, 
  addEdge,
  Edge,
  Node,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  ProOptions
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { stepApi } from '../api/step.api';
import { executionApi } from '../api/execution.api';
import { ApiResponse } from '../types/auth';
import { Workflow } from '../types/workflow';
import StepNode from '../components/editor/StepNode';
import EditorSidebar from '../components/editor/EditorSidebar';
import { Save, Play, Plus, ChevronLeft, Layout, MousePointer2, CheckCircle, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const nodeTypes = {
  step: StepNode,
};

const proOptions: ProOptions = { hideAttribution: true };

const WorkflowEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const { data: workflow, isLoading } = useQuery<Workflow>({
    queryKey: ['workflow', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Workflow>>(`/workflows/${id}`);
      return response.data.data;
    },
  });

  const queryClient = useQueryClient();

  const { data: stepsData, isLoading: isStepsLoading } = useQuery<any[]>({
    queryKey: ['steps', id],
    queryFn: async () => {
      const res = await stepApi.getSteps(id!);
      return res.data.data;
    },
    enabled: !!id
  });

  const saveStepMutation = useMutation({
    mutationFn: async ({ stepId, data }: { stepId: string, data: any }) => {
      const isNew = stepId.length < 15; 
      const payload = {
        name: data.label,
        stepType: (data.type || 'TASK').toUpperCase(),
        metadata: data.metadata || {}
      };
      if (isNew) {
        return await stepApi.createStep(id!, payload);
      } else {
        return await stepApi.updateStep(id!, stepId, payload);
      }
    },
    onSuccess: () => {
      toast.success('Step saved successfully');
      queryClient.invalidateQueries({ queryKey: ['steps', id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save step');
    }
  });

  // Populate nodes from fetched steps
  useEffect(() => {
    if (stepsData) {
      const fetchedNodes = stepsData.map((step: any, index: number) => ({
        id: step.id,
        type: 'step',
        position: { x: 250, y: 50 + index * 150 },
        data: { 
          label: step.name, 
          type: step.type, 
          metadata: step.metadata,
          onEdit: () => setSelectedNodeId(step.id) 
        },
      }));
      setNodes(fetchedNodes);
      setEdges([]);
    }
  }, [stepsData]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#06b6d4' } }, eds)),
    []
  );

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const onUpdateNode = useCallback((id: string, data: any) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data } : n)));
  }, []);

  const onDeleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setSelectedNodeId(null);
  }, []);

  const handleSaveStep = useCallback((nodeId: string, data: any) => {
    saveStepMutation.mutate({ stepId: nodeId, data });
  }, [saveStepMutation]);

  // Auto-layout: Vertical positioning
  const handleAutoLayout = useCallback(() => {
    const VERTICAL_SPACING = 200;
    const START_X = 400;
    const START_Y = 50;

    setNodes((nds) => 
      nds.map((node, index) => ({
        ...node,
        position: { x: START_X, y: START_Y + index * VERTICAL_SPACING }
      }))
    );
    toast.success('Auto-layout applied');
  }, []);

  // Test Run handler
  const handleTestRun = useCallback(async () => {
    if (!id) return;
    try {
      const res = await executionApi.startExecution(id, { inputData: {} });
      toast.success('Execution started!');
      const execId = res.data?.data?.id || res.data?.data?.executionId;
      if (execId) {
        window.location.href = `/executions/${execId}`;
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to start execution');
    }
  }, [id]);

  if (isLoading || isStepsLoading) return <div className="p-8">Loading editor...</div>;

  return (
    <div className="flex flex-col h-screen -m-8 relative overflow-hidden">
      {/* Editor Header */}
      <div className="h-16 glass-card !rounded-none !border-t-0 !border-x-0 flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-4">
          <Link to="/workflows" className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
            <ChevronLeft size={20} />
          </Link>
          <div className="h-6 w-px bg-slate-700" />
          <div>
            <h1 className="text-sm font-bold text-white uppercase tracking-wider">{workflow?.name}</h1>
            <p className="text-[10px] text-slate-500 font-medium">Auto-saving enabled</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleAutoLayout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all text-xs font-bold"
          >
            <Layout size={14} /> Auto-layout
          </button>
          <button 
            onClick={handleTestRun}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20 transition-all text-xs font-bold"
          >
            <Play size={14} className="fill-emerald-400" /> Test Run
          </button>
          <button className="btn-primary flex items-center gap-2 text-xs py-2">
            <Save size={14} /> Publish Workflow
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Toolbox */}
        <div className="w-16 glass-card !rounded-none !border-y-0 !border-l-0 flex flex-col items-center py-6 gap-6 z-10">
          <button 
            onClick={() => {
              const newId = Math.random().toString(36).substr(2, 9);
              setNodes((nds) => [
                ...nds, 
                { 
                  id: newId, 
                  type: 'step', 
                  position: { x: 400, y: 300 }, 
                  data: { label: 'New Step', type: 'TASK', onEdit: () => setSelectedNodeId(newId) } 
                }
              ]);
            }}
            className="p-3 rounded-2xl bg-cyan-600 shadow-lg shadow-cyan-900/40 text-white hover:scale-110 active:scale-95 transition-all"
          >
            <Plus size={24} />
          </button>
          <div className="w-8 h-px bg-slate-800" />
          <div className="flex flex-col gap-4 text-slate-500">
            <MousePointer2 size={20} className="text-cyan-500" />
            <Play size={20} />
            <CheckCircle size={20} />
            <Bell size={20} />
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative bg-slate-950">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            proOptions={proOptions}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            fitView
          >
            <Background color="#1e293b" gap={20} />
            <Controls className="!bg-slate-800 !border-slate-700 !fill-slate-400 shadow-2xl" />
          </ReactFlow>
        </div>

        {/* Sidebar */}
        <EditorSidebar 
          selectedNode={selectedNode as any} 
          nodes={nodes}
          workflowId={id || ''}
          onClose={() => setSelectedNodeId(null)}
          onUpdate={onUpdateNode}
          onDelete={onDeleteNode}
          onSave={handleSaveStep}
        />
      </div>
    </div>
  );
};

export default WorkflowEditorPage;
