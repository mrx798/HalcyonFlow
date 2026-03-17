import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { executionApi } from '../api/execution.api';
import { ApiResponse } from '../types/auth';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';

type Stage = 'input' | 'progress' | 'logs';

const calcDuration = (startedAt: string, endedAt: string) => {
  if (!startedAt || !endedAt) return '00:00:00';
  const diff = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  if (diff < 0 || isNaN(diff)) return '00:00:00';
  const secs = Math.floor(diff / 1000);
  const h = Math.floor(secs / 3600).toString().padStart(2, '0');
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const ExecuteWorkflowPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // workflowId
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>('input');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);

  // Load Workflow for Stage 1
  const { data: workflow, isLoading: wfLoading } = useQuery({
    queryKey: ['workflow', id],
    queryFn: async () => {
      const r = await api.get<ApiResponse<any>>(`/workflows/${id}`);
      return r.data.data;
    },
    enabled: stage === 'input',
  });

  // Poll Execution for Stages 2 and 3
  const { data: execution, refetch: refetchExec } = useQuery({
    queryKey: ['execution', executionId],
    queryFn: async () => {
      if (!executionId) return null;
      const r = await executionApi.getExecution(executionId);
      return r.data.data;
    },
    enabled: !!executionId,
    refetchInterval: (query) => {
      if (stage !== 'progress') return false;
      const s = query.state.data?.status;
      return (s === 'IN_PROGRESS' || s === 'PAUSED') ? 3000 : false;
    },
  });

  // Auto-transition from Progress to Logs if completed/failed
  useEffect(() => {
    if (stage === 'progress' && execution) {
      if (execution.status === 'COMPLETED' || execution.status === 'FAILED') {
        setStage('logs');
      }
    }
  }, [execution, stage]);

  /* ━━━━━━━━━━━━━━━━━━━━ STAGE 1: INPUT FORM ━━━━━━━━━━━━━━━━━━━━ */
  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleStartExecution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflow) return;
    
    // Validate required fields
    const schemaEntries = Object.entries(workflow.inputSchema || {});
    for (const [key, schema] of schemaEntries) {
      const s = schema as any;
      if (s.required && formData[key] === undefined && formData[key] !== 0) {
        toast.error(`"${key}" is required`); return;
      }
    }

    setIsExecuting(true);
    try {
      const res = await executionApi.startExecution(id!, { inputData: formData });
      const execId = res.data?.data?.id || res.data?.data?.executionId;
      if (execId) {
        setExecutionId(execId);
        setStage('progress');
        toast.success('Execution started');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to start execution');
    } finally {
      setIsExecuting(false);
    }
  };

  const renderInputForm = () => {
    if (wfLoading) return <div className="text-slate-400 p-8">Loading fields...</div>;
    const schemaEntries = Object.entries(workflow?.inputSchema || {});

    return (
      <form onSubmit={handleStartExecution} className="max-w-xl border border-white/20 p-6 font-mono text-sm space-y-4 shadow-2xl bg-[#0a0f1c]">
        <div className="border-b border-white/20 pb-4 mb-4">
          <h2 className="text-white font-bold text-base">Execute Workflow</h2>
          <p className="text-slate-300">{workflow?.name}</p>
        </div>

        {schemaEntries.map(([key, schema]: [string, any]) => {
          const isReq = schema.required;
          const allowed = schema.allowedValues || schema.allowed_values || schema.enum;
          const type = schema.type || 'string';
          
          return (
            <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-slate-300 w-32 shrink-0">
                - {key}: {isReq && <span className="text-red-400">*</span>}
              </label>
              
              <div className="flex items-center gap-3 flex-1">
                {allowed && Array.isArray(allowed) ? (
                  <select 
                    value={formData[key] ?? ''} 
                    onChange={e => handleFieldChange(key, e.target.value)}
                    className="flex-1 bg-transparent border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-cyan-500"
                  >
                    <option value="" className="bg-slate-900">Select...</option>
                    {allowed.map((v: string) => <option key={v} value={v} className="bg-slate-900">{v}</option>)}
                  </select>
                ) : type === 'number' ? (
                  <input 
                    type="number" 
                    value={formData[key] ?? ''} 
                    onChange={e => handleFieldChange(key, e.target.value ? Number(e.target.value) : undefined)}
                    className="flex-1 bg-transparent border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-cyan-500"
                  />
                ) : type === 'boolean' ? (
                  <select 
                    value={formData[key] === true ? 'true' : formData[key] === false ? 'false' : ''} 
                    onChange={e => handleFieldChange(key, e.target.value === 'true')}
                    className="flex-1 bg-transparent border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-cyan-500"
                  >
                    <option value="" className="bg-slate-900">Select...</option>
                    <option value="true" className="bg-slate-900">Yes</option>
                    <option value="false" className="bg-slate-900">No</option>
                  </select>
                ) : (
                  <input 
                    type="text" 
                    value={formData[key] ?? ''} 
                    onChange={e => handleFieldChange(key, e.target.value)}
                    className="flex-1 bg-transparent border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-cyan-500"
                  />
                )}
                <span className="text-slate-500 text-xs w-20 shrink-0">({type})</span>
              </div>
            </div>
          );
        })}

        {schemaEntries.length === 0 && (
          <p className="text-slate-500 italic py-4">No input fields required.</p>
        )}

        <div className="pt-6 mt-4 flex justify-center">
          <button 
            type="submit" 
            disabled={isExecuting}
            className="border border-white/20 bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded transition-colors"
          >
            [ Start Execution ]
          </button>
        </div>
      </form>
    );
  };

  /* ━━━━━━━━━━━━━━━━━━━━ STAGE 2: PROGRESS VIEW ━━━━━━━━━━━━━━━━━━━━ */
  const handleApproval = async (approve: boolean) => {
    try {
      await executionApi.resumeExecution(executionId!, { approved: approve, comment: approve ? 'Approved' : 'Rejected' });
      refetchExec();
    } catch { toast.error('Approval failed'); }
  };

  const renderProgress = () => {
    if (!execution) return <div className="text-slate-400">Loading progress...</div>;

    const currentStepId = execution.currentStepId;
    const isPaused = execution.status === 'PAUSED';
    const logs = execution.logs || [];
    
    return (
      <div className="max-w-xl border border-white/20 p-6 font-mono text-sm space-y-6 shadow-2xl bg-[#0a0f1c]">
        <div className="border-b border-white/20 pb-4 view-header">
          <h2 className="text-white font-bold text-base">Execution Progress</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-300">{workflow?.name || execution.workflowName}</p>
            <span className="bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded text-xs">[{execution.status} 🟡]</span>
          </div>
        </div>

        <div>
          <p className="text-slate-300 mb-1">Current Step: <span className="text-white font-bold">{execution.currentStepId ? workflow?.steps?.find((s:any) => s.id === execution.currentStepId)?.name || 'Unknown' : '—'}</span></p>
          <p className="text-slate-300">Status: <span className="text-cyan-400">{isPaused ? 'Waiting for approval' : 'Running...'}</span></p>
        </div>

        {/* Steps List */}
        <div className="border border-white/20 p-4 space-y-2 bg-slate-900/50">
          {(workflow?.steps || []).map((step: any, idx: number) => {
            const isCurrent = step.id === currentStepId;
            const logEntry = logs.find((l:any) => l.step_name === step.name || l.stepName === step.name);
            const isDone = logEntry?.status === 'COMPLETED';
            const isFail = logEntry?.status === 'FAILED';

            return (
              <div key={step.id} className="flex items-center justify-between">
                <span className={isCurrent ? 'text-yellow-400 font-bold' : isDone ? 'text-slate-300' : 'text-slate-500'}>
                  Step {idx + 1}: {step.name}
                </span>
                <span className="text-xs shrink-0">
                  {isCurrent ? <span className="text-yellow-400 animate-pulse">⏳ IN PROGRESS</span> :
                   isDone ? <span className="text-emerald-500">✅ COMPLETED</span> :
                   isFail ? <span className="text-red-500">❌ FAILED</span> :
                   <span className="text-slate-600">○ PENDING</span>}
                </span>
              </div>
            );
          })}
        </div>

        {/* Action Panel */}
        {isPaused && (
          <div className="border border-amber-500/30 bg-amber-500/5 p-4 mt-6">
            <p className="text-amber-500 font-bold mb-2">⚠️ Action Required</p>
            <p className="text-slate-300 mb-4">Step "{workflow?.steps?.find((s:any) => s.id === currentStepId)?.name}" needs your approval</p>
            <div className="flex gap-4">
              <button onClick={() => handleApproval(true)} className="border border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded transition-colors text-xs font-bold">
                [ ✓ Approve ]
              </button>
              <button onClick={() => handleApproval(false)} className="border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-1.5 rounded transition-colors text-xs font-bold">
                [ ✗ Reject ]
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ━━━━━━━━━━━━━━━━━━━━ STAGE 3: EXECUTION LOGS ━━━━━━━━━━━━━━━━━━━━ */
  const renderLogs = () => {
    if (!execution) return null;
    const isCompleted = execution.status === 'COMPLETED';
    const logs = execution.logs || [];
    
    return (
      <div className="max-w-2xl border border-white/20 p-6 font-mono text-sm space-y-6 shadow-2xl bg-[#0a0f1c] mb-10">
        <div className="border-b border-white/20 pb-4">
          <h2 className="text-white font-bold text-base">Execution Logs</h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
            <span className="text-slate-300">{workflow?.name || execution.workflowName}</span>
            <span className={`px-2 py-0.5 rounded text-xs ${isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              [{execution.status} {isCompleted ? '✅' : '❌'}]
            </span>
            <span className="text-slate-500 text-xs">Started: {new Date(execution.startedAt).toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="space-y-6">
          {logs.map((log: any, idx: number) => {
            const rules = log.evaluatedRules || log.evaluated_rules || [];
            return (
              <div key={idx} className="space-y-2">
                <h3 className="text-white font-bold">[Step {idx + 1}] {log.stepName || log.step_name}</h3>
                
                {rules.length > 0 && (
                  <div>
                    <p className="text-slate-400">Rules evaluated:</p>
                    <div className="pl-4 space-y-1 mt-1">
                      {rules.map((r: any, ri: number) => {
                        const ruleText = r.rule || r.condition;
                        const v = Boolean(r.result);
                        return (
                          <div key={ri} className={v ? 'text-emerald-300' : 'text-slate-500'}>
                            {v ? '✅' : '❌'} {ruleText} → {v ? 'true' : 'false'}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="text-slate-300">
                  <p>Next Step: <span className="text-white">{log.selectedNextStep || log.selected_next_step || 'End Workflow'}</span></p>
                  <p>Status: {log.status}</p>
                  {(log.approverId || log.approver_id || log.approverName) && (
                    <p>Approver: {(log.approverId || log.approver_id || log.approverName)}</p>
                  )}
                  <p>Duration: {calcDuration(log.startedAt || log.started_at, log.endedAt || log.ended_at)}</p>
                </div>

                {idx < logs.length - 1 && <hr className="border-white/10 mt-6" />}
              </div>
            );
          })}
        </div>

        <div className="pt-6 border-t border-white/20 flex justify-center mt-8">
          <button onClick={() => navigate('/workflows')} className="border border-white/20 bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded transition-colors">
            Back to Workflows
          </button>
        </div>
      </div>
    );
  };

  /* ━━━━━━━━━━━━━━━━━━━━ MAIN RENDER ━━━━━━━━━━━━━━━━━━━━ */
  return (
    <div className="min-h-screen py-10 px-4 flex items-start justify-center">
      <div className="absolute top-6 left-6">
         <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-mono">
            <ChevronLeft size={16} /> Back
         </button>
      </div>
      
      {stage === 'input' && renderInputForm()}
      {stage === 'progress' && renderProgress()}
      {stage === 'logs' && renderLogs()}
    </div>
  );
};

export default ExecuteWorkflowPage;
