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
    if (wfLoading) return <div className="text-[#525252] p-8 font-mono animate-pulse uppercase tracking-widest text-sm">Loading workflow data...</div>;
    const schemaEntries = Object.entries(workflow?.inputSchema || {});
    const reqCount = schemaEntries.filter(([_, s]: any) => s.required).length;

    return (
      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8">
        
        {/* Left Side: Form */}
        <form onSubmit={handleStartExecution} className="flex-1 font-sans text-sm border border-white/[0.06] bg-[#0e0e0e] rounded-xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/[0.04] bg-[#080808]">
             <div className="flex items-center gap-2 mb-1">
               <span className="text-amber-500">⚡</span>
               <h2 className="text-[#fafafa] font-semibold text-lg tracking-tight">Execute Workflow</h2>
             </div>
             <div className="flex items-center gap-3 text-[#a1a1a1] text-xs font-medium">
                <span className="text-emerald-400 font-semibold tracking-wide">{workflow?.name}</span>
                <span className="text-[#3a3a3a]">•</span>
                <span>{workflow?.steps?.length || 0} steps</span>
                <span className="text-[#3a3a3a]">•</span>
                <span className="bg-white/[0.04] border border-white/[0.08] px-1.5 py-0.5 rounded font-bold">v{workflow?.version || 1}</span>
             </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex justify-between items-end border-b border-white/[0.04] pb-2 mb-6">
              <span className="text-[#525252] font-bold tracking-widest uppercase text-[10px]">INPUT PARAMETERS</span>
              <span className="text-[#a1a1a1] text-[10px] font-medium">{reqCount} required fields</span>
            </div>

            {schemaEntries.map(([key, schema]: [string, any]) => {
              const isReq = schema.required;
              const type = schema.type || 'string';
              
              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="text-[#fafafa] font-medium text-[10px] uppercase tracking-wider">
                      {key} {isReq && <span className="text-amber-500 ml-1 font-bold">*</span>}
                    </label>
                    <span className="text-[#525252] uppercase tracking-widest font-mono text-[10px]">{type}</span>
                  </div>
                  <div className="border border-white/[0.10] rounded-lg bg-[#141414] p-1 focus-within:border-amber-500/60 focus-within:ring-1 focus-within:ring-amber-500/30 transition-all">
                    <input 
                      type={type === 'number' ? 'number' : 'text'}
                      value={formData[key] ?? ''} 
                      onChange={e => handleFieldChange(key, type === 'number' && e.target.value ? Number(e.target.value) : e.target.value)}
                      className="w-full bg-transparent px-3 py-2 text-[#fafafa] outline-none font-mono text-sm placeholder-[#525252]"
                      placeholder={`Enter ${key}...`}
                    />
                  </div>
                </div>
              );
            })}

            {schemaEntries.length === 0 && (
              <p className="text-[#525252] py-8 text-center text-sm font-medium">No parameters required.</p>
            )}

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={isExecuting}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 text-black hover:bg-amber-400 py-3 rounded-lg transition-colors font-semibold tracking-wide text-sm"
              >
                ▶ Start Execution
              </button>
            </div>
          </div>
        </form>

        {/* Right Side: Payload Preview */}
        <div className="w-[400px] hidden lg:flex flex-col font-mono text-sm">
           <div className="flex items-center gap-3 mb-4 text-[#525252] text-[10px] tracking-widest uppercase font-bold">
              <div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-[#3a3a3a]"></div><div className="w-2 h-2 rounded-full bg-[#3a3a3a]"></div><div className="w-2 h-2 rounded-full bg-[#3a3a3a]"></div></div>
              Live Payload Preview
           </div>
           <div className="flex-1 border border-white/[0.06] bg-[#0e0e0e] rounded-xl p-6 text-amber-500/80 shadow-2xl overflow-auto whitespace-pre inset-shadow">
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
    if (!execution) return <div className="text-[#525252] font-mono translate-y-2 uppercase tracking-widest text-sm animate-pulse">Loading execution tracking...</div>;

    const currentStepId = execution.currentStepId;
    const isPaused = execution.status === 'PAUSED';
    const logs = execution.logs || [];
    
    return (
      <div className="w-full max-w-2xl border border-white/[0.06] bg-[#0e0e0e] rounded-xl overflow-hidden shadow-2xl font-sans text-sm">
        <div className="p-5 border-b border-white/[0.04] bg-[#080808] flex justify-between items-start flex-col sm:flex-row gap-2">
           <div>
             <h2 className="text-[#fafafa] font-semibold text-base flex items-center gap-3 tracking-tight">
               {workflow?.name || execution.workflowName} 
               <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] tracking-wider font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span> LIVE
               </span>
               <span className="text-[10px] bg-white/[0.04] text-[#a1a1a1] px-2 py-0.5 rounded border border-white/[0.08] font-bold tracking-wider uppercase">[{execution.status}]</span>
             </h2>
             <p className="text-[#525252] text-xs mt-1 font-mono">Started: {new Date(execution.startedAt).toLocaleTimeString()}</p>
           </div>
        </div>

        <div className="p-6">
          <div className="border-b border-white/[0.04] pb-2 mb-6 text-[#525252] font-bold tracking-widest uppercase text-[10px] flex justify-between items-center">
             <span>EXECUTION PROGRESS</span>
             {execution.status === 'IN_PROGRESS' && <span className="text-amber-500 animate-pulse text-[10px]">Refreshing...</span>}
          </div>

          {/* Steps List */}
          <div className="space-y-4 mb-8 pl-2 font-mono">
            {(workflow?.steps || []).map((step: any, idx: number) => {
              const isCurrent = step.id === currentStepId;
              const logEntry = logs.find((l:any) => l.step_name === step.name || l.stepName === step.name);
              const isDone = logEntry?.status === 'COMPLETED';
              const isFail = logEntry?.status === 'FAILED';
              const isPending = !isCurrent && !isDone && !isFail;

              return (
                <div key={step.id} className="flex items-center gap-4 group">
                  <div className="w-6 flex justify-center shrink-0">
                    {isDone ? <span className="text-emerald-500 text-lg">✓</span> :
                     isFail ? <span className="text-red-500 text-lg">✗</span> :
                     isCurrent ? <span className="text-amber-500 text-lg animate-pulse">●</span> :
                     <span className="text-[#3a3a3a] text-lg font-mono">{idx + 1}</span>}
                  </div>
                  
                  <div className="flex-1 flex justify-between items-center border-b border-white/[0.03] pb-2">
                    <span className={`
                       text-sm transition-colors font-sans
                       ${isDone ? 'text-[#a1a1a1]' : ''}
                       ${isCurrent ? 'text-amber-500 font-semibold' : ''}
                       ${isPending ? 'text-[#525252]' : ''}
                       ${isFail ? 'text-red-400 font-semibold' : ''}
                    `}>
                      {step.name}
                    </span>
                    
                    <span className="text-[10px] font-mono tracking-widest font-bold uppercase">
                       {isDone && <span className="flex items-center gap-4"><span className="text-emerald-500/70">COMPLETED</span> <span className="text-[#525252] w-16 text-right">{calcDuration(logEntry.startedAt || logEntry.started_at, logEntry.endedAt || logEntry.ended_at)}</span></span>}
                       {isCurrent && <span className="text-amber-500 flex items-center gap-2">IN PROGRESS <span className="text-amber-500/50 mt-[-2px] tracking-tighter">████░░░</span> <span className="text-[#525252]">WAITING</span></span>}
                       {isPending && <span className="text-[#3a3a3a]">PENDING</span>}
                       {isFail && <span className="text-red-500">FAILED</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Panel */}
          {isPaused && (
            <div className="border border-amber-500/30 bg-amber-500/10 rounded-xl overflow-hidden mt-8 shadow-[0_0_20px_rgba(245,158,11,0.05)]">
              <div className="border-t-2 border-amber-500 w-full h-0"></div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-amber-500 font-bold mb-3 tracking-widest uppercase text-[10px]">
                   ⚠️ ACTION REQUIRED
                </div>
                <div className="border-t border-white/[0.04] mb-3"></div>
                <p className="text-[#fafafa] text-sm mb-5 font-medium">
                  Step <span className="text-amber-400 font-bold">"{workflow?.steps?.find((s:any) => s.id === currentStepId)?.name}"</span> is waiting for your decision.
                </p>
                <div className="flex flex-col md:flex-row gap-4">
                  <button onClick={() => handleApproval(true)} 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg text-xs font-bold tracking-widest uppercase flex justify-center items-center gap-2 transition-colors shadow-lg shadow-emerald-900/20">
                    <span className="text-lg pb-1">✓</span> APPROVE
                  </button>
                  <button onClick={() => handleApproval(false)} 
                    className="flex-1 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-lg text-xs font-bold tracking-widest uppercase flex justify-center items-center gap-2 transition-colors">
                    <span className="text-lg pb-1">✗</span> REJECT
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
      <div className="w-full max-w-2xl border border-white/[0.06] bg-[#0e0e0e] rounded-xl overflow-hidden shadow-2xl font-sans text-sm mb-12">
        <div className="p-6 border-b border-white/[0.04] pb-5 bg-[#080808]">
          <div className="text-[#525252] font-bold tracking-widest uppercase text-[10px] mb-3">Execution Logs</div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
             <div className="flex items-center gap-3">
               <h2 className="text-[#fafafa] font-semibold text-lg tracking-tight">{workflow?.name || execution.workflowName}</h2>
               <span className={`flex justify-center items-center gap-1.5 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${isCompleted ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                 {isCompleted ? '✓' : '✗'} {execution.status}
               </span>
             </div>
             <div className="text-[#a1a1a1] text-xs font-mono">Started: {new Date(execution.startedAt).toLocaleTimeString()}</div>
          </div>
        </div>

        <div className="p-6">
          <div className="border-b border-white/[0.04] w-full mb-8 uppercase tracking-[0.3em] text-[#3a3a3a] text-[10px] text-center pb-2">─────────────────────────────</div>

          <div className="space-y-12">
            {logs.map((log: any, idx: number) => {
              const rules = log.evaluatedRules || log.evaluated_rules || [];
              const rawNext = log.selectedNextStep || log.selected_next_step;
              const nextStepDisplay = (rawNext === 'END' || rawNext === '__end__' || !rawNext) ? 'End Workflow' : rawNext;
              
              return (
                <div key={idx} className="space-y-4">
                  <div>
                    <h3 className="text-[#fafafa] font-bold text-base tracking-tight flex items-center gap-2">
                       <span className="text-[#525252] font-mono text-xs">[{idx + 1}]</span> {log.stepName || log.step_name}
                    </h3>
                  </div>
                  
                  <div className="pl-2 space-y-4 font-mono">
                     <div className="text-[#3a3a3a] tracking-[0.2em] font-bold text-[10px] w-full border-b border-white/[0.03] pb-1">─────────────────────────────</div>
                     
                     {rules.length > 0 && (
                       <div>
                         <p className="text-[#a1a1a1] text-[10px] uppercase tracking-wider mb-2 font-sans font-bold">Rules evaluated:</p>
                         <div className="pl-4 space-y-2 text-xs">
                           {rules.map((r: any, ri: number) => {
                             const ruleText = r.rule || r.condition;
                             const v = Boolean(r.result);
                             return (
                               <div key={ri} className="flex gap-2 items-start">
                                 <span className="shrink-0">{v ? '✓' : '✗'}</span>
                                 <code className={`font-mono break-all ${v ? 'text-emerald-400' : 'text-red-400'}`}>{ruleText}</code>
                                 <span className="text-[#525252] shrink-0">  →  </span>
                                 <span className={v ? 'text-emerald-400' : 'text-red-400'}>{v ? 'true' : 'false'}</span>
                               </div>
                             );
                           })}
                         </div>
                       </div>
                     )}

                     <div className="space-y-2 text-xs">
                       <div className="grid grid-cols-[120px_1fr] items-baseline">
                          <div className="uppercase tracking-widest text-[#525252] font-sans text-[10px] font-bold">Next Step:</div>
                          <div className="text-[#fafafa]">{nextStepDisplay}</div>
                       </div>
                       
                       <div className="grid grid-cols-[120px_1fr] items-baseline">
                          <div className="uppercase tracking-widest text-[#525252] font-sans text-[10px] font-bold">Status:</div>
                          <div className="text-[#fafafa]">{log.status}</div>
                       </div>
                       
                       {(log.approverId || log.approver_id || log.approverName) && (
                         <div className="grid grid-cols-[120px_1fr] items-baseline">
                            <div className="uppercase tracking-widest text-[#525252] font-sans text-[10px] font-bold">Approver:</div>
                            <div className="text-amber-400">{(log.approverName || (log.approverId === currentUser.id ? currentUser.name : log.approverId) || log.approver_id)}</div>
                         </div>
                       )}
                       
                       <div className="grid grid-cols-[120px_1fr] items-baseline">
                          <div className="uppercase tracking-widest text-[#525252] font-sans text-[10px] font-bold">Duration:</div>
                          <div className="text-[#a1a1a1]">{calcDuration(log.startedAt || log.started_at, log.endedAt || log.ended_at)}</div>
                       </div>
                     </div>
                  </div>
                  
                  {idx < logs.length - 1 && (
                     <div className="pt-8 w-full">
                       <div className="border-b border-white/[0.04] uppercase tracking-[0.3em] text-[#3a3a3a] text-[10px] text-center pb-2">─────────────────────────────</div>
                     </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-10 mt-8 border-t border-white/[0.04] flex justify-center gap-4">
            <button onClick={() => navigate('/workflows')} 
              className="text-[#a1a1a1] hover:text-[#fafafa] hover:bg-white/[0.04] transition-colors uppercase tracking-widest text-[10px] font-bold px-4 py-2 rounded-lg">
              [ Back to Workflows ]
            </button>
            <button onClick={() => { setStage('input'); setExecutionId(null); setFormData({}); }} 
              className="text-amber-500 hover:text-amber-400 transition-colors uppercase tracking-widest text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-4 py-2 rounded-lg flex items-center gap-1.5">
              <span className="text-sm pb-0.5">↺</span> Run Again
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ━━━━━━━━━━━━━━━━━━━━ MAIN RENDER ━━━━━━━━━━━━━━━━━━━━ */
  return (
    <div className="w-full h-full relative font-sans text-sm pb-12">
      <div className="mb-6 flex items-center justify-between">
         <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#a1a1a1] hover:text-[#fafafa] transition-colors text-xs font-semibold uppercase tracking-widest">
            <ChevronLeft size={16} /> Back
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

