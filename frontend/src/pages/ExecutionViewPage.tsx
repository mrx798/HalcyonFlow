import React, { useState, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Node, 
  Edge,
  ProOptions
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { executionApi } from '../api/execution.api';
import { ApiResponse } from '../types/auth';
import { Execution } from '../types/execution';
import StepNode from '../components/editor/StepNode';
import { 
  ChevronLeft, 
  Clock, 
  Terminal,
  MousePointer2,
  Check,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const nodeTypes = {
  step: StepNode,
};

const proOptions: ProOptions = { hideAttribution: true };

const ExecutionViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const { data: execution, isLoading, refetch } = useQuery({
    queryKey: ['execution', id],
    queryFn: async () => {
      const response = await executionApi.getExecution(id!);
      return response.data.data;
    },
    refetchInterval: (query) => 
      query.state.data?.status === 'RUNNING' || query.state.data?.status === 'PAUSED' ? 2000 : false,
  });

  useEffect(() => {
    if (execution) {
      // Logic to transform workflow steps into nodes would go here
      // For now, mock based on execution status
      setNodes([
        {
          id: '1',
          type: 'step',
          position: { x: 250, y: 50 },
          data: { 
            label: 'Start Workflow', 
            type: 'TASK', 
            onEdit: () => {} 
          },
          selected: execution.currentStepId === '1'
        },
        {
          id: '2',
          type: 'step',
          position: { x: 250, y: 200 },
          data: { 
            label: 'User Approval', 
            type: 'APPROVAL', 
            onEdit: () => {} 
          },
          selected: execution.status === 'PAUSED'
        },
      ]);
      setEdges([
        { id: 'e1-2', source: '1', target: '2', animated: execution.status === 'RUNNING', style: { stroke: execution.status === 'RUNNING' ? '#06b6d4' : '#334155' } },
      ]);
    }
  }, [execution]);

  const handleApproval = async (approve: boolean) => {
    try {
      await executionApi.resumeExecution(id!, {
        approved: approve,
        comment: approve ? 'Approved via Dashboard' : 'Rejected via Dashboard'
      });
      toast.success(approve ? 'Step approved' : 'Step rejected');
      refetch();
    } catch (error: any) {
      toast.error('Action failed');
    }
  };

  if (isLoading) return <div className="p-8">Loading execution details...</div>;

  const getStatusColor = () => {
    switch (execution?.status) {
      case 'COMPLETED': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'FAILED': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'PAUSED': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20';
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Just started';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Just started';
    return date.toLocaleString();
  };

  return (
    <div className="flex flex-col h-screen -m-8 relative overflow-hidden">
      {/* Header */}
      <div className="h-16 glass-card !rounded-none !border-t-0 !border-x-0 flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-4">
          <Link to="/executions" className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
            <ChevronLeft size={20} />
          </Link>
          <div className="h-6 w-px bg-slate-700" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-bold text-white uppercase tracking-wider">{execution?.workflowName}</h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor()}`}>
                {execution?.status}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">ID: {execution?.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2 pr-4 border-r border-slate-800">
            <Clock size={14} />
            {formatDate(execution?.startedAt)}
          </div>
          <p className="pl-1">Duration: {execution?.duration ? execution.duration : '--'}</p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 relative bg-slate-950">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            proOptions={proOptions}
            fitView
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
          >
            <Background color="#1e293b" gap={20} />
            <Controls className="!bg-slate-800 !border-slate-700 !fill-slate-400 shadow-2xl" />
          </ReactFlow>

          {/* Action Overlay */}
          <AnimatePresence>
            {execution?.status === 'PAUSED' && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 glass-card p-6 flex flex-col items-center gap-4 border border-amber-500/30 z-20 shadow-amber-900/20"
              >
                <div className="flex items-center gap-3 text-amber-500">
                  <MousePointer2 className="w-5 h-5" />
                  <p className="text-sm font-bold uppercase tracking-wider">Awaiting your approval</p>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleApproval(false)}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all font-bold text-sm"
                  >
                    <X size={18} /> REJECT
                  </button>
                  <button 
                    onClick={() => handleApproval(true)}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-400 transition-all font-bold text-sm"
                  >
                    <Check size={18} /> APPROVE STEP
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar: Logs & Data */}
        <div className="w-96 glass border-l border-slate-700/50 h-full flex flex-col">
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center gap-2 text-cyan-500 mb-2">
              <Terminal size={18} />
              <h2 className="text-sm font-bold uppercase tracking-widest">Execution Logs</h2>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar font-mono">
            {execution?.logs.map((log: any, i: number) => (
              <div key={i} className="text-[11px] p-3 rounded-lg bg-slate-900/50 border border-slate-800/50 space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-500">[{formatDate(log.timestamp)}]</span>
                  <span className={`px-1.5 py-0.5 rounded-md font-bold ${
                    log.status === 'COMPLETED' ? 'text-emerald-500 bg-emerald-500/10' :
                    log.status === 'FAILED' ? 'text-red-400 bg-red-400/10' :
                    'text-cyan-500 bg-cyan-500/10'
                  }`}>
                    {log.stepName || 'SYSTEM'}
                  </span>
                </div>
                
                <p className="text-slate-300 leading-relaxed">
                  <span className="text-slate-500">{'>'}</span> {log.action || (log.status ? `Step ${log.status}` : 'Update')}
                  {log.details && <span className="text-slate-400 block mt-1 ml-3 border-l border-slate-800 pl-2">{log.details}</span>}
                </p>

                {log.evaluatedRules && log.evaluatedRules.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800/50">
                    <p className="text-[9px] text-slate-500 mb-1 uppercase font-bold">Rules Evaluated:</p>
                    {log.evaluatedRules.map((rule: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 mb-1">
                        <span className={rule.result ? 'text-emerald-500' : 'text-slate-600'}>
                          {rule.result ? '✓' : '×'}
                        </span>
                        <span className="text-slate-400 text-[10px]">{rule.condition}:</span>
                        <span className={rule.result ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                          {rule.result ? 'TRUE' : 'FALSE'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {log.selectedNextStep && (
                  <div className="flex items-center gap-2 text-[10px] text-cyan-500">
                    <span>↪</span>
                    <span>Next: {log.selectedNextStep}</span>
                  </div>
                )}
              </div>
            ))}
            {(!execution?.logs || execution.logs.length === 0) && (
              <p className="text-slate-600 text-xs italic">No logs available for this execution.</p>
            )}
          </div>

          <div className="p-6 border-t border-slate-700/50 bg-slate-900/30">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Context Data</h3>
            <div className="space-y-2">
              {Object.entries(execution?.inputData || {}).map(([key, val]: any) => (
                <div key={key} className="flex justify-between text-[11px]">
                  <span className="text-slate-400">{key}:</span>
                  <span className="text-slate-200 font-mono italic">{JSON.stringify(val)}</span>
                </div>
              ))}
              {Object.keys(execution?.inputData || {}).length === 0 && (
                <p className="text-slate-600 text-[10px] italic">No variables defined.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutionViewPage;
