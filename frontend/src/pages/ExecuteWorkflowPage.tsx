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
      const s = query?.state?.data?.status;
      return (s === 'IN_PROGRESS' || s === 'PAUSED') ? 2000 : false;
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
    if (wfLoading) return <div className="text-slate-400 p-8 font-mono animate-pulse">Loading workflow data...</div>;
    const schemaEntries = Object.entries(workflow?.inputSchema || {});
    const reqCount = schemaEntries.filter(([_, s]: any) => s.required).length;

    return (
      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8">
        
        {/* Left Side: Form */}
        <form onSubmit={handleStartExecution} className="flex-1 font-mono text-sm border border-slate-700 bg-[#0B0F19] rounded-xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-700/50 bg-slate-900/50">
             <div className="flex items-center gap-2 mb-1">
               <span className="text-amber-400">⚡</span>
               <h2 className="text-white font-bold text-lg tracking-wide uppercase">Execute Workflow</h2>
             </div>
             <div className="flex items-center gap-3 text-slate-400 text-xs">
                <span className="text-emerald-400 font-bold">{workflow?.name}</span>
                <span>•</span>
                <span>{workflow?.steps?.length || 0} steps</span>
                <span>•</span>
                <span className="bg-slate-800 px-1.5 py-0.5 rounded">v{workflow?.version || 1}</span>
             </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex justify-between items-end border-b border-slate-700 pb-2 mb-6">
              <span className="text-slate-500 font-bold tracking-widest uppercase text-xs">INPUT PARAMETERS</span>
              <span className="text-slate-400 text-xs">{reqCount} required fields</span>
            </div>

            {schemaEntries.map(([key, schema]: [string, any]) => {
              const isReq = schema.required;
              const type = schema.type || 'string';
              
              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="text-slate-200 font-bold">
                      {key} {isReq && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    <span className="text-slate-500 uppercase tracking-widest">{type}</span>
                  </div>
                  <div className="border border-slate-700 rounded bg-[#0f172a] p-1 shadow-inner focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
                    <input 
                      type={type === 'number' ? 'number' : 'text'}
                      value={formData[key] ?? ''} 
                      onChange={e => handleFieldChange(key, type === 'number' && e.target.value ? Number(e.target.value) : e.target.value)}
                      className="w-full bg-transparent px-3 py-2 text-white outline-none font-mono text-sm placeholder-slate-700"
                      placeholder={`Enter ${key}...`}
                    />
                  </div>
                </div>
              );
            })}

            {schemaEntries.length === 0 && (
              <p className="text-slate-500 py-8 text-center italic">No parameters required.</p>
            )}

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={isExecuting}
                className="w-full flex items-center justify-center gap-2 border border-indigo-500 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 py-4 rounded transition-colors font-bold tracking-wider hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]"
              >
                ▶ Start Execution
              </button>
            </div>
          </div>
        </form>

        {/* Right Side: Payload Preview */}
        <div className="w-[400px] hidden lg:flex flex-col font-mono text-sm">
           <div className="flex items-center gap-3 mb-4 text-slate-500 text-xs tracking-widest uppercase font-bold">
              <div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500/50"></div><div className="w-2 h-2 rounded-full bg-yellow-500/50"></div><div className="w-2 h-2 rounded-full bg-green-500/50"></div></div>
              Live Payload Preview
           </div>
           <div className="flex-1 border border-slate-800 bg-[#0B0F19] rounded-xl p-6 text-emerald-400 shadow-2xl overflow-auto whitespace-pre">
{JSON.stringify({
  workflowId: id,
  inputData: formData
}, null, 2)}
           </div>
        </div>

      </div>
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
    if (!execution) return <div className="text-slate-400 font-mono animate-pulse">Loading execution tracking...</div>;

    const currentStepId = execution.currentStepId;
    const isPaused = execution.status === 'PAUSED';
    const logs = execution.logs || [];
    
    return (
      <div className="w-full max-w-2xl border border-slate-700 bg-[#0B0F19] rounded-xl overflow-hidden shadow-2xl font-mono text-sm">
        <div className="p-5 border-b border-slate-700/50 bg-slate-900/50 flexjustify-between items-start flex flex-col sm:flex-row gap-2">
           <div>
             <h2 className="text-white font-bold text-base flex items-center gap-3">
               {workflow?.name || execution.workflowName} 
               <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] tracking-wide bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span> LIVE
               </span>
               <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">[{execution.status}]</span>
             </h2>
             <p className="text-slate-500 text-xs mt-1">Started: {new Date(execution.startedAt).toLocaleTimeString()}</p>
           </div>
        </div>

        <div className="p-6">
          <div className="border-b border-slate-700 pb-2 mb-6 text-slate-500 font-bold tracking-widest uppercase text-xs flex justify-between items-center">
             <span>EXECUTION PROGRESS</span>
             {execution.status === 'IN_PROGRESS' && <span className="text-cyan-600 animate-pulse text-[10px]">Refreshing...</span>}
          </div>

          {/* Steps List */}
          <div className="space-y-4 mb-8 pl-2">
            {(workflow?.steps || []).map((step: any, idx: number) => {
              const isCurrent = step.id === currentStepId;
              const logEntry = logs.find((l:any) => l.step_name === step.name || l.stepName === step.name);
              const isDone = logEntry?.status === 'COMPLETED';
              const isFail = logEntry?.status === 'FAILED';
              const isPending = !isCurrent && !isDone && !isFail;

              return (
                <div key={step.id} className="flex items-center gap-4">
                  <div className="w-6 flex justify-center shrink-0">
                    {isDone ? <span className="text-green-500 text-lg">✅</span> :
                     isFail ? <span className="text-red-500 text-lg">❌</span> :
                     isCurrent ? <span className="text-yellow-400 text-lg animate-bounce">⏳</span> :
                     <span className="text-slate-600 text-lg opacity-50">○</span>}
                  </div>
                  
                  <div className="flex-1 flex justify-between items-center border-b border-white/5 pb-2">
                    <span className={`
                       ${isDone ? 'text-slate-300' : ''}
                       ${isCurrent ? 'text-yellow-400 font-bold' : ''}
                       ${isPending ? 'text-slate-500' : ''}
                       ${isFail ? 'text-red-400 font-bold' : ''}
                    `}>
                      {idx + 1}. {step.name}
                    </span>
                    
                    <span className="text-xs uppercase tracking-widest font-bold">
                       {isDone && <span className="text-slate-500 flex items-center gap-4"><span className="text-green-500/70">COMPLETED</span> <span className="font-mono text-[10px] w-16 text-right">{calcDuration(logEntry.startedAt || logEntry.started_at, logEntry.endedAt || logEntry.ended_at)}</span></span>}
                       {isCurrent && <span className="text-yellow-500 flex items-center gap-2">IN PROGRESS <span className="text-yellow-500/50 ml-2 tracking-tighter">████░░░░</span> waiting...</span>}
                       {isPending && <span className="text-slate-600">PENDING</span>}
                       {isFail && <span className="text-red-500">FAILED</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Panel */}
          {isPaused && (
            <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl overflow-hidden mt-8 shadow-[0_0_20px_rgba(245,158,11,0.05)]">
              <div className="border-t-2 border-amber-500 w-full h-0"></div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-amber-500 font-bold mb-3 tracking-widest uppercase text-xs">
                   ⚠️ ACTION REQUIRED
                </div>
                <div className="border-t border-slate-700/50 mb-3"></div>
                <p className="text-slate-300 md:text-sm text-xs mb-5">
                  Step <span className="text-amber-400 font-bold">"{workflow?.steps?.find((s:any) => s.id === currentStepId)?.name}"</span> is waiting for your decision.
                </p>
                <div className="flex flex-col md:flex-row gap-4">
                  <button onClick={() => handleApproval(true)} 
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded text-sm font-bold tracking-widest uppercase flex justify-center items-center gap-2 transition-colors shadow-lg shadow-green-900/20">
                    <span className="text-lg">✓</span> APPROVE
                  </button>
                  <button onClick={() => handleApproval(false)} 
                    className="flex-1 border border-red-500/50 bg-transparent hover:bg-red-500/10 text-red-400 py-3 rounded text-sm font-bold tracking-widest uppercase flex justify-center items-center gap-2 transition-colors">
                    <span className="text-lg">✗</span> REJECT
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ━━━━━━━━━━━━━━━━━━━━ STAGE 3: EXECUTION LOGS ━━━━━━━━━━━━━━━━━━━━ */
  const renderLogs = () => {
    if (!execution) return null;
    const isCompleted = execution.status === 'COMPLETED';
    const logs = execution.logs || [];
    // User context fallback for approvers (in real app comes from auth context/backend users list)
    const currentUser = JSON.parse(localStorage.getItem('auth_user') || '{"name":"System"}');
    
    return (
      <div className="w-full max-w-2xl border border-slate-700 bg-[#0B0F19] rounded-xl overflow-hidden shadow-2xl font-mono text-sm mb-12">
        <div className="p-6 border-b border-slate-700 pb-5 bg-slate-900/50">
          <div className="text-slate-500 font-bold tracking-widest uppercase text-xs mb-3">Execution Logs</div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
             <div className="flex items-center gap-3">
               <h2 className="text-white font-bold text-lg">{workflow?.name || execution.workflowName}</h2>
               <span className={`flex justify-center items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold tracking-wide border ${isCompleted ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                 {isCompleted ? '✅' : '❌'} {execution.status}
               </span>
             </div>
             <div className="text-slate-400 text-xs">Started: {new Date(execution.startedAt).toLocaleTimeString()}</div>
          </div>
        </div>

        <div className="p-6">
          <div className="border-b border-slate-700/50 w-full mb-8 uppercase tracking-[0.3em] text-slate-600 text-[10px] text-center pb-2">─────────────────────────────</div>

          <div className="space-y-12">
            {logs.map((log: any, idx: number) => {
              const rules = log.evaluatedRules || log.evaluated_rules || [];
              const rawNext = log.selectedNextStep || log.selected_next_step;
              const nextStepDisplay = (rawNext === 'END' || rawNext === '__end__' || !rawNext) ? 'End Workflow' : rawNext;
              
              return (
                <div key={idx} className="space-y-4">
                  <div>
                    <h3 className="text-white font-black text-base tracking-wide flex items-center gap-2">
                       <span className="text-slate-500">[Step {idx + 1}]</span> {log.stepName || log.step_name}
                    </h3>
                  </div>
                  
                  <div className="pl-2 space-y-4">
                     <div className="text-slate-600 tracking-[0.2em] font-bold text-[10px] w-full border-b border-slate-800 pb-1">─────────────────────────────</div>
                     
                     {rules.length > 0 && (
                       <div>
                         <p className="text-slate-400 text-xs mb-2">Rules evaluated:</p>
                         <div className="pl-4 space-y-2 text-xs">
                           {rules.map((r: any, ri: number) => {
                             const ruleText = r.rule || r.condition;
                             const v = Boolean(r.result);
                             return (
                               <div key={ri} className="flex gap-2">
                                 <span className="shrink-0">{v ? '✅' : '❌'}</span>
                                 <code className={`font-mono ${v ? 'text-green-400' : 'text-red-400'}`}>{ruleText}</code>
                                 <span className="text-slate-500 shrink-0">  →  </span>
                                 <span className={v ? 'text-green-400' : 'text-red-400'}>{v ? 'true' : 'false'}</span>
                               </div>
                             );
                           })}
                         </div>
                       </div>
                     )}

                     <div className="space-y-2 text-xs font-mono">
                       <div className="grid grid-cols-[120px_1fr] items-baseline">
                          <div className="uppercase tracking-wide text-slate-500">Next Step:</div>
                          <div className="text-white">{nextStepDisplay}</div>
                       </div>
                       
                       <div className="grid grid-cols-[120px_1fr] items-baseline">
                          <div className="uppercase tracking-wide text-slate-500">Status:</div>
                          <div className="text-white">{log.status}</div>
                       </div>
                       
                       {(log.approverId || log.approver_id || log.approverName) && (
                         <div className="grid grid-cols-[120px_1fr] items-baseline">
                            <div className="uppercase tracking-wide text-slate-500">Approver:</div>
                            <div className="text-white">{(log.approverName || (log.approverId === currentUser.id ? currentUser.name : log.approverId) || log.approver_id)}</div>
                         </div>
                       )}
                       
                       <div className="grid grid-cols-[120px_1fr] items-baseline">
                          <div className="uppercase tracking-wide text-slate-500">Duration:</div>
                          <div className="text-slate-300">{calcDuration(log.startedAt || log.started_at, log.endedAt || log.ended_at)}</div>
                       </div>
                     </div>
                  </div>
                  
                  {idx < logs.length - 1 && (
                     <div className="pt-8 w-full">
                       <div className="border-b border-slate-700/50 uppercase tracking-[0.3em] text-slate-600 text-[10px] text-center pb-2">─────────────────────────────</div>
                     </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-10 mt-8 border-t border-slate-700/50 flex justify-center gap-6">
            <button onClick={() => navigate('/workflows')} 
              className="text-slate-400 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold border border-transparent hover:border-slate-700 px-4 py-2 rounded">
              [ Back to Workflows ]
            </button>
            <button onClick={() => { setStage('input'); setExecutionId(null); setFormData({}); }} 
              className="text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-4 py-2 rounded">
              [ Run Again ]
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ━━━━━━━━━━━━━━━━━━━━ MAIN RENDER ━━━━━━━━━━━━━━━━━━━━ */
  return (
    <div className="w-full h-full relative font-mono text-sm">
      <div className="mb-8">
         <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm">
            <ChevronLeft size={16} /> [ Back ]
         </button>
      </div>

      <div className="flex items-start justify-center">
        {stage === 'input' && renderInputForm()}
        {stage === 'progress' && renderProgress()}
        {stage === 'logs' && renderLogs()}
      </div>
    </div>
  );
};

export default ExecuteWorkflowPage;
