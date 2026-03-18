import React from 'react';
import { Node } from 'reactflow';
import { WorkflowNodeData } from '../../types';
import { X, Save, Trash2, Plus, ArrowRight, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface EditorSidebarProps {
  selectedNode: Node<WorkflowNodeData> | null;
  nodes: Node<any>[];
  backendSteps?: any[];
  workflowId: string;
  onClose: () => void;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
  onSave: (id: string, data: any) => void;
}

const EditorSidebar: React.FC<EditorSidebarProps> = ({ 
  selectedNode, 
  nodes,
  backendSteps,
  workflowId,
  onClose, 
  onUpdate,
  onDelete,
  onSave
}) => {
  const [rules, setRules] = React.useState<any[]>([]);
  
  // Use the explicit isNew flag to determine if the backend has this step yet
  const isNewStep = selectedNode?.data?.isNew ?? false;

  React.useEffect(() => {
    if (!isNewStep && selectedNode?.id) {
      import('../../api/rule.api').then(({ ruleApi }) => {
        ruleApi.getRules(workflowId, selectedNode.id).then(res => {
          setRules(res.data.data || []);
        }).catch(() => {
          // Silent — rules may not exist yet
          setRules([]);
        });
      });
    } else {
      setRules([]);
    }
  }, [selectedNode?.id, isNewStep, workflowId]);

  const addRule = () => {
    setRules([...rules, { id: crypto.randomUUID(), condition: '', nextStepId: '', isDefault: false, isNew: true }]);
  };

  const saveRule = async (rule: any) => {
    if (isNewStep) {
      toast.warning('Save the step first before adding rules.');
      return;
    }
    const { ruleApi } = await import('../../api/rule.api');
    try {
      const isValidUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
      
      let nextStepId = rule.nextStepId;
      if (nextStepId === '__end__' || !nextStepId) {
        nextStepId = null;
      }

      if (nextStepId !== null && !isValidUuid(nextStepId)) {
        toast.error('Please save the target step first before creating rules pointing to it');
        return;
      }

      const payload = {
        condition: rule.condition || 'DEFAULT',
        nextStepId,
        priority: rule.priority || null,
        isDefault: rule.isDefault || false,
      };
      if (rule.isNew) {
        const res = await ruleApi.createRule(workflowId, selectedNode!.id, payload);
        setRules(rules.map(r => r.id === rule.id ? { ...res.data.data, isNew: false } : r));
        toast.success('Rule created successfully');
      } else {
        await ruleApi.updateRule(workflowId, selectedNode!.id, rule.id, payload);
        toast.success('Rule updated successfully');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save rule');
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      const rule = rules.find(r => r.id === ruleId);
      if (!rule?.isNew) {
        const { ruleApi } = await import('../../api/rule.api');
        await ruleApi.deleteRule(workflowId, selectedNode!.id, ruleId);
        toast.success('Rule deleted');
      }
      setRules(rules.filter(r => r.id !== ruleId));
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete rule');
    }
  };

  const moveRule = (index: number, direction: 'up' | 'down') => {
    const newRules = [...rules];
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newRules.length) return;
    [newRules[index], newRules[swapIdx]] = [newRules[swapIdx], newRules[index]];
    // Update priorities
    newRules.forEach((r, i) => { r.priority = i + 1; });
    setRules(newRules);
    // Call backend reorder if rules are saved
    const savedRuleIds = newRules.filter(r => r.id?.length > 15).map(r => r.id);
    if (savedRuleIds.length > 1 && selectedNode) {
      import('../../api/rule.api').then(({ ruleApi }) => {
        ruleApi.reorderRules(workflowId, selectedNode.id, { ruleIds: savedRuleIds }).catch(() => {
          toast.error('Failed to save rule order');
        });
      });
    }
  };

  if (!selectedNode) return null;

  const data = selectedNode.data;

  return (
    <div className="w-96 glass border-l border-white/[0.06] h-full flex flex-col">
      <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
        <h2 className="text-xl font-bold text-white uppercase tracking-tight">Step Configuration</h2>
        <button onClick={onClose} className="p-2 hover:bg-[#141414] rounded-lg transition-colors">
          <X className="w-5 h-5 text-[#a1a1a1]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        <div className="space-y-4">
          <label className="text-xs font-bold text-[#525252] uppercase tracking-widest">General Info</label>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-[#a1a1a1] mb-1.5">Step Name</p>
              <input 
                type="text" 
                value={data.label}
                onChange={(e) => onUpdate(selectedNode.id, { ...data, label: e.target.value })}
                className="w-full input-field text-sm"
              />
            </div>
            <div>
              <p className="text-sm text-[#a1a1a1] mb-1.5">Step Type</p>
              <select 
                value={data.type}
                onChange={(e) => onUpdate(selectedNode.id, { ...data, type: e.target.value })}
                className="w-full input-field text-sm"
              >
                <option value="TASK">Task</option>
                <option value="APPROVAL">Approval</option>
                <option value="NOTIFICATION">Notification</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#525252] uppercase tracking-widest">Routing Rules</label>
            {!isNewStep && (
              <button onClick={addRule} className="p-1 px-2 rounded-lg bg-amber-600/10 text-amber-500 hover:bg-amber-600/20 transition-all text-[10px] font-bold flex items-center gap-1">
                <Plus size={10} /> ADD RULE
              </button>
            )}
          </div>
          
          {isNewStep ? (
            <div className="p-4 rounded-xl border border-dashed border-white/[0.06] bg-[#0e0e0e]/50 flex flex-col items-center text-center gap-3">
              <p className="text-xs text-[#a1a1a1]">Save this step first to enable routing rules</p>
              <button
                onClick={() => onSave(selectedNode!.id, data)}
                className="btn-primary text-xs py-1.5 px-4 flex items-center justify-center gap-2"
              >
                <Save size={14} /> Save Step
              </button>
            </div>
          ) : (
          <div className="space-y-3">
            {rules.map((rule, idx) => (
              <div key={rule.id} className={`p-4 rounded-xl border space-y-3 ${rule.isDefault ? 'bg-[#0e0e0e]/50 border-white/[0.06] border-dashed' : 'bg-[#0e0e0e]/50 border-white/[0.06]'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#141414] text-[9px] text-[#a1a1a1] font-bold flex items-center justify-center">{idx + 1}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rule.isDefault ? 'text-[#525252] bg-slate-500/10 uppercase' : 'text-amber-500 bg-amber-500/10'}`}>
                      {rule.isDefault ? 'Default Fallback' : 'IF CONDITION'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveRule(idx, 'up')}
                      disabled={idx === 0}
                      className="p-0.5 rounded hover:bg-[#141414] transition-colors disabled:opacity-20"
                      title="Move up (higher priority)"
                    >
                      <ChevronUp size={12} className="text-[#a1a1a1]" />
                    </button>
                    <button
                      onClick={() => moveRule(idx, 'down')}
                      disabled={idx === rules.length - 1}
                      className="p-0.5 rounded hover:bg-[#141414] transition-colors disabled:opacity-20"
                      title="Move down (lower priority)"
                    >
                      <ChevronDown size={12} className="text-[#a1a1a1]" />
                    </button>
                    <Trash2 onClick={() => deleteRule(rule.id)} className="w-3.5 h-3.5 text-[#525252] hover:text-red-500 cursor-pointer transition-colors ml-1" />
                  </div>
                </div>
                {!rule.isDefault && (
                  <input 
                    placeholder="amount > 1000" 
                    value={rule.condition || ''}
                    onChange={e => {
                      const newRules = [...rules];
                      newRules[idx].condition = e.target.value;
                      setRules(newRules);
                    }}
                    className="w-full bg-[#080808]/50 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500/50 transition-colors"
                  />
                )}
                <div className="flex items-center gap-2 text-[10px] text-[#a1a1a1] mt-2">
                  <ArrowRight size={10} /> GOTO STEP:
                  <select 
                    value={rule.nextStepId || ''}
                    onChange={e => {
                      const newRules = [...rules];
                      newRules[idx].nextStepId = e.target.value || null;
                      setRules(newRules);
                    }}
                    className="bg-transparent border-none text-[#fafafa] outline-none p-0 cursor-pointer"
                  >
                    <option value="">Select a step</option>
                    <option value="__end__">🏁 End Workflow</option>
                    {nodes
                      .filter(n => n.id !== selectedNode?.id)
                      .map(n => {
                        const label = n.data?.label || n.data?.name || "Unnamed Step";
                        const isDraft = n.data?.isNew;
                        return (
                          <option key={n.id} value={n.id}>
                            {label} {isDraft ? '(Draft)' : ''}
                          </option>
                        );
                      })}
                  </select>
                </div>
                <button
                  onClick={() => saveRule(rules[idx])}
                  className="w-full mt-2 py-1.5 rounded-lg bg-amber-600/10 text-amber-500 hover:bg-amber-600/20 transition-all text-[10px] font-bold"
                >
                  Save Rule
                </button>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>

      <div className="p-6 border-t border-white/[0.06] grid grid-cols-2 gap-4">
        <button 
          onClick={() => onDelete(selectedNode.id)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all text-sm font-bold"
        >
          <Trash2 size={16} /> Delete Step
        </button>
        <button 
          onClick={() => onSave(selectedNode.id, data)}
          className="btn-primary flex items-center justify-center gap-2 text-sm"
        >
          <Save size={16} /> Save Changes
        </button>
      </div>
    </div>
  );
};

export default EditorSidebar;

