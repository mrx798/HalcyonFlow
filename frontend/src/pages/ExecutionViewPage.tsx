import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { executionApi } from '../api/execution.api';
import api from '../api/axios';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';

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

const ExecutionViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // executionId
  const navigate = useNavigate();

  const { data: execution, isLoading: execLoading, refetch: refetchExec } = useQuery({
    queryKey: ['execution', id],
    queryFn: async () => {
      const r = await executionApi.getExecution(id!);
      return r.data.data;
    },
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return (s === 'IN_PROGRESS' || s === 'PAUSED') ? 3000 : false;
    },
  });

  const { data: workflow } = useQuery({
    queryKey: ['workflow', execution?.workflowId],
    queryFn: async () => {
      const r = await api.get(`/workflows/${execution!.workflowId}`);
      return r.data.data;
    },
    enabled: !!execution?.workflowId,
  });

  const handleApproval = async (approve: boolean) => {
    try {
      await executionApi.resumeExecution(id!, { approved: approve, comment: approve ? 'Approved' : 'Rejected' });
      refetchExec();
    } catch { toast.error('Approval failed'); }
  };

  if (execLoading) return <div className="p-10 text-[#a1a1a1] font-mono">Loading execution...</div>;
  if (!execution) return <div className="p-10 text-[#a1a1a1] font-mono">Execution not found.</div>;

  const isCompleted = execution.status === 'COMPLETED';
  const isFailed = execution.status === 'FAILED';
  const isPaused = execution.status === 'PAUSED';
  const isDone = isCompleted || isFailed;
  const currentStepId = execution.currentStepId;
  const logs = execution.logs || [];

  /* ━━━━━━━━━━━━━━━━━━━━ STAGE 2: PROGRESS VIEW ━━━━━━━━━━━━━━━━━━━━ */
  const renderProgress = () => {
    return (
      <div className="max-w-xl border border-white/[0.08] p-6 font-mono text-sm space-y-6 shadow-2xl bg-[#0e0e0e] rounded-xl">
        <div className="border-b border-white/[0.06] pb-4">
          <h2 className="text-[#fafafa] font-bold text-base tracking-tight">Execution Progress</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[#a1a1a1]">{workflow?.name || execution.workflowName}</p>
            <span className="bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">[{execution.status} 🟡]</span>
          </div>
        </div>

        <div>
           <p className="text-[#a1a1a1] mb-1">Current Step: <span className="text-[#fafafa] font-bold">{currentStepId ? workflow?.steps?.find((s:any) => s.id === currentStepId)?.name || 'Unknown' : '—'}</span></p>
           <p className="text-[#a1a1a1]">Status: <span className="text-amber-500">{isPaused ? 'Waiting for approval' : 'Running...'}</span></p>
        </div>

        <div className="border border-white/[0.04] p-4 space-y-2 bg-[#141414] rounded-lg">
          {(workflow?.steps || []).map((step: any, idx: number) => {
            const isCurrent = step.id === currentStepId;
            const logEntry = logs.find((l:any) => l.step_name === step.name || l.stepName === step.name);
            const isStepDone = logEntry?.status === 'COMPLETED';
            const isStepFail = logEntry?.status === 'FAILED';

            return (
              <div key={step.id} className="flex items-center justify-between">
                <span className={isCurrent ? 'text-amber-500 font-bold' : isStepDone ? 'text-[#a1a1a1]' : 'text-[#525252]'}>
                  Step {idx + 1}: {step.name}
                </span>
                <span className="text-xs shrink-0 font-bold tracking-widest uppercase text-[10px]">
                  {isCurrent ? <span className="text-amber-500 animate-pulse">⏳ IN PROGRESS</span> :
                   isStepDone ? <span className="text-emerald-500">✅ COMPLETED</span> :
                   isStepFail ? <span className="text-red-500">❌ FAILED</span> :
                   <span className="text-[#525252]">○ PENDING</span>}
                </span>
              </div>
            );
          })}
        </div>

        {isPaused && (
          <div className="border border-amber-500/30 bg-amber-500/5 p-4 mt-6 rounded-lg">
            <p className="text-amber-500 font-bold mb-2 tracking-wide">⚠️ Action Required</p>
            <p className="text-[#fafafa] mb-4">Step "{workflow?.steps?.find((s:any) => s.id === currentStepId)?.name}" needs your approval</p>
            <div className="flex gap-4">
              <button onClick={() => handleApproval(true)} className="border border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded transition-colors text-[10px] uppercase tracking-widest font-bold">
                [ ✓ Approve ]
              </button>
              <button onClick={() => handleApproval(false)} className="border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-1.5 rounded transition-colors text-[10px] uppercase tracking-widest font-bold">
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
    return (
      <div className="max-w-2xl border border-white/[0.08] p-6 font-mono text-sm space-y-6 shadow-2xl bg-[#0e0e0e] mb-10 rounded-xl">
        <div className="border-b border-white/[0.06] pb-4">
          <h2 className="text-[#fafafa] font-bold text-base tracking-tight">Execution Logs</h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
            <span className="text-[#a1a1a1]">{workflow?.name || execution.workflowName}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase ${isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-500'}`}>
              [{execution.status} {isCompleted ? '✅' : '❌'}]
            </span>
            <span className="text-[#525252] text-xs">Started: {new Date(execution.startedAt).toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="space-y-6">
          {logs.map((log: any, idx: number) => {
            const rules = log.evaluatedRules || log.evaluated_rules || [];
            return (
              <div key={idx} className="space-y-2">
                <h3 className="text-[#fafafa] font-bold">[Step {idx + 1}] {log.stepName || log.step_name}</h3>
                
                {rules.length > 0 && (
                  <div>
                    <p className="text-[#a1a1a1] text-xs">Rules evaluated:</p>
                    <div className="pl-4 space-y-1 mt-1">
                      {rules.map((r: any, ri: number) => {
                        const ruleText = r.rule || r.condition;
                        const v = Boolean(r.result);
                        return (
                          <div key={ri} className={v ? 'text-emerald-400' : 'text-[#525252]'}>
                            {v ? '✅' : '❌'} {ruleText} → {v ? 'true' : 'false'}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="text-[#a1a1a1] space-y-0.5">
                  <p>Next Step: <span className="text-[#fafafa]">{log.selectedNextStep || log.selected_next_step || 'End Workflow'}</span></p>
                  <p>Status: {log.status}</p>
                  {(log.approverId || log.approver_id || log.approverName) && (
                    <p>Approver: {(log.approverId || log.approver_id || log.approverName)}</p>
                  )}
                  <p>Duration: {calcDuration(log.startedAt || log.started_at, log.endedAt || log.ended_at)}</p>
                </div>

                {idx < logs.length - 1 && <hr className="border-white/[0.04] mt-6" />}
              </div>
            );
          })}
        </div>

        <div className="pt-6 border-t border-white/[0.06] flex justify-center mt-8">
          <button onClick={() => navigate('/executions')} className="border border-white/[0.10] bg-white/[0.02] hover:bg-white/[0.06] text-[#fafafa] px-6 py-2 rounded-lg transition-colors text-[10px] font-bold tracking-widest uppercase">
            Back to Audit Logs
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen py-10 px-4 flex flex-col items-center">
      <div className="self-start mb-6 ml-4 sm:ml-10">
         <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#a1a1a1] hover:text-[#fafafa] transition-colors text-xs font-mono font-bold tracking-widest uppercase">
            <ChevronLeft size={16} /> Back
         </button>
      </div>

      {!isDone ? renderProgress() : renderLogs()}
    </div>
  );
};

export default ExecutionViewPage;

