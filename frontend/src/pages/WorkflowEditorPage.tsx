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
import InputSchemaEditor from '../components/editor/InputSchemaEditor';
import { Save, Play, Plus, ChevronLeft, Layout, MousePointer2, CheckCircle, Bell, Database, GitBranch } from 'lucide-react';
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
  const [showSchemaEditor, setShowSchemaEditor] = useState(false);

  const { data: executionsRes } = useQuery({
    queryKey: ['executions', id],
    queryFn: () => executionApi.getExecutionsByWorkflow(id!).then(res => res.data.data),
    enabled: !!id
  });

  const workflowStats = useMemo(() => {
    if (!executionsRes || !Array.isArray(executionsRes)) return { total: 0, successRate: 0, avgDuration: 0, recentStatus: [] };
    const wEx = executionsRes;
    const completed = wEx.filter((e: any) => e.status === 'COMPLETED');
    const successRate = wEx.length ? Math.round((completed.length / wEx.length) * 100) : 0;
    
    let totalDuration = 0;
    let durationCount = 0;
    completed.forEach((e: any) => {
      if (e.startedAt && e.endedAt) {
        totalDuration += new Date(e.endedAt).getTime() - new Date(e.startedAt).getTime();
        durationCount++;
      }
    });
    const avgDuration = durationCount ? Math.round(totalDuration / durationCount / 1000) : 0;
    
    return {
      total: wEx.length,
      successRate,
      avgDuration,
      recentStatus: wEx.slice(0, 10).map((e: any) => e.status)
    };
  }, [executionsRes]);

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
      const isNew = !!data.isNew; 
      const payload = {
        name: data.label,
        stepType: (data.type || 'TASK').toUpperCase(),
        metadata: data.metadata || {}
      };
      if (isNew) {
        const res = await stepApi.createStep(id!, payload);
        return { isNew: true, oldId: stepId, response: res };
      } else {
        const res = await stepApi.updateStep(id!, stepId, payload);
        return { isNew: false, oldId: stepId, response: res };
      }
    },
    onSuccess: (result) => {
      toast.success('Step saved successfully');
      if (result.isNew && result.response?.data?.data?.id) {
        const newId = result.response.data.data.id;
        const oldId = result.oldId;
        // Replace the temporary node ID with the real backend UUID
        setNodes((nds) => nds.map((n) => 
          n.id === oldId 
            ? { ...n, id: newId, data: { ...n.data, isNew: false, onEdit: () => setSelectedNodeId(newId) } } 
            : n
        ));
        setEdges((eds) => eds.map((e) => ({
          ...e,
          source: e.source === oldId ? newId : e.source,
          target: e.target === oldId ? newId : e.target,
        })));
        if (selectedNodeId === oldId) {
          setSelectedNodeId(newId);
        }
      }
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

      // Load rules for each step and build edges
      const loadEdges = async () => {
        const { ruleApi } = await import('../api/rule.api');
        const allEdges: Edge[] = [];
        for (const step of stepsData) {
          try {
            const res = await ruleApi.getRules(id!, step.id);
            const stepRules = res.data.data || [];
            stepRules.forEach((rule: any) => {
              if (rule.nextStepId) {
                allEdges.push({
                  id: `e-${step.id}-${rule.nextStepId}-${rule.id}`,
                  source: step.id,
                  target: rule.nextStepId,
                  animated: true,
                  label: rule.condition !== 'DEFAULT' ? rule.condition : 'default',
                  style: { stroke: '#06b6d4' },
                  labelStyle: { fill: '#94a3b8', fontSize: 10 },
                  labelBgStyle: { fill: '#0f172a', fillOpacity: 0.8 },
                  labelBgPadding: [6, 4] as [number, number],
                });
              }
            });
          } catch {
            // No rules for this step — skip
          }
        }
        setEdges(allEdges);
      };
      loadEdges();
    }
  }, [stepsData, id]);

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

  // Test Run handler — navigate to execute page
  const handleTestRun = useCallback(() => {
    if (!id) return;
    window.location.href = `/workflows/${id}/execute`;
  }, [id]);

  // Publish Workflow handler
  const handlePublish = useCallback(async () => {
    if (!id || !workflow) return;
    try {
      await api.put(`/workflows/${id}`, { 
        name: workflow.name, 
        description: workflow.description || '', 
        status: 'ACTIVE',
        inputSchema: workflow.inputSchema || {} 
      });
      toast.success('Workflow published successfully!');
      queryClient.invalidateQueries({ queryKey: ['workflow', id] });
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to publish workflow');
    }
  }, [id, workflow, queryClient]);

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
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white uppercase tracking-wider">{workflow?.name}</h1>
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">v{workflow?.version || 1}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                workflow?.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>{workflow?.status || 'DRAFT'}</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">{nodes.length} step{nodes.length !== 1 ? 's' : ''} · Auto-saving</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowSchemaEditor(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400 hover:bg-purple-600/20 transition-all text-xs font-bold"
          >
            <Database size={14} /> Schema {Object.keys(workflow?.inputSchema || {}).length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-[9px]">{Object.keys(workflow?.inputSchema || {}).length}</span>}
          </button>
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
          <button 
            onClick={handlePublish}
            className="btn-primary flex items-center gap-2 text-xs py-2"
          >
            <Save size={14} /> Publish Workflow
          </button>
        </div>
      </div>

      {/* Workflow Stats Panel (Feature 4) */}
      <div className="h-10 bg-slate-900/50 border-b border-slate-700/50 px-6 flex items-center justify-between z-10 text-[10px] font-mono">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 uppercase tracking-widest">Total Runs:</span>
            <span className="text-white font-bold">{workflowStats.total}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 uppercase tracking-widest">Success Rate:</span>
            <span className={workflowStats.successRate >= 90 ? 'text-emerald-400 font-bold' : workflowStats.successRate >= 50 ? 'text-amber-400 font-bold' : 'text-red-400 font-bold'}>
              {workflowStats.successRate}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 uppercase tracking-widest">Avg Runtime:</span>
            <span className="text-cyan-400 font-bold">{workflowStats.avgDuration}s</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-slate-600 uppercase tracking-widest mr-2">Recent:</span>
          {workflowStats.recentStatus.map((status: string, i: number) => (
            <div 
              key={i} 
              className={`w-2 h-4 rounded-sm ${status === 'COMPLETED' ? 'bg-emerald-500' : status === 'FAILED' ? 'bg-red-500' : 'bg-amber-500'}`}
              title={status}
            />
          ))}
          {workflowStats.recentStatus.length === 0 && <span className="text-slate-700 italic">No executions</span>}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Toolbox */}
        <div className="w-16 glass-card !rounded-none !border-y-0 !border-l-0 flex flex-col items-center py-6 gap-6 z-10">
          <button 
            onClick={() => {
              const newId = crypto.randomUUID();
              setNodes((nds) => [
                ...nds, 
                { 
                  id: newId, 
                  type: 'step', 
                  position: { x: 400, y: 300 }, 
                  data: { label: 'New Step', type: 'TASK', isNew: true, onEdit: () => setSelectedNodeId(newId) } 
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

      {/* Input Schema Editor Modal */}
      {showSchemaEditor && workflow && (
        <InputSchemaEditor
          workflow={workflow}
          onClose={() => setShowSchemaEditor(false)}
          onSave={(schema) => {
            queryClient.invalidateQueries({ queryKey: ['workflow', id] });
          }}
        />
      )}
    </div>
  );
};

export default WorkflowEditorPage;
