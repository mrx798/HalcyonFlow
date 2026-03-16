import React from 'react';
import { Node } from 'reactflow';
import { WorkflowNodeData } from '../../types/editor';
import { X, Save, Trash2, Plus, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface EditorSidebarProps {
  selectedNode: Node<WorkflowNodeData> | null;
  nodes: Node<any>[];
  workflowId: string;
  onClose: () => void;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
  onSave: (id: string, data: any) => void;
}

const EditorSidebar: React.FC<EditorSidebarProps> = ({ 
  selectedNode, 
  nodes,
  workflowId,
  onClose, 
  onUpdate,
  onDelete,
  onSave
}) => {
  const [rules, setRules] = React.useState<any[]>([]);
  
  // Quick hack: Since we just need string IDs assuming short IDs mean "uncreated" yet
  const isNewStep = selectedNode?.id?.length ? selectedNode.id.length < 15 : true;

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
    setRules([...rules, { id: Math.random().toString(), condition: '', nextStepId: '', isDefault: false }]);
  };

  const saveRule = async (rule: any) => {
    if (isNewStep) {
      toast.warning('Save the step first before adding rules.');
      return;
    }
    const { ruleApi } = await import('../../api/rule.api');
    try {
      const isValidUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
      const nextStepId = rule.nextStepId && isValidUuid(rule.nextStepId) ? rule.nextStepId : null;
      const payload = {
        condition: rule.condition || 'DEFAULT',
        nextStepId,
        priority: rule.priority || null,
        isDefault: rule.isDefault || false,
      };
      if (rule.id.length < 15) {
        const res = await ruleApi.createRule(workflowId, selectedNode!.id, payload);
        setRules(rules.map(r => r.id === rule.id ? res.data.data : r));
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
      if (ruleId.length > 15) {
        const { ruleApi } = await import('../../api/rule.api');
        await ruleApi.deleteRule(workflowId, selectedNode!.id, ruleId);
        toast.success('Rule deleted');
      }
      setRules(rules.filter(r => r.id !== ruleId));
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete rule');
    }
  };

  if (!selectedNode) return null;

  const data = selectedNode.data;

  return (
    <div className="w-96 glass border-l border-slate-700/50 h-full flex flex-col">
      <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white uppercase tracking-tight">Step Configuration</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">General Info</label>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-400 mb-1.5">Step Name</p>
              <input 
                type="text" 
                value={data.label}
                onChange={(e) => onUpdate(selectedNode.id, { ...data, label: e.target.value })}
                className="w-full input-field text-sm"
              />
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1.5">Step Type</p>
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
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Routing Rules</label>
            <button onClick={addRule} className="p-1 px-2 rounded-lg bg-cyan-600/10 text-cyan-500 hover:bg-cyan-600/20 transition-all text-[10px] font-bold flex items-center gap-1">
              <Plus size={10} /> ADD RULE
            </button>
          </div>
          {isNewStep && <p className="text-xs text-amber-500">Save step first before adding rules.</p>}
          <div className="space-y-3">
            {rules.map((rule, idx) => (
              <div key={rule.id} className={`p-4 rounded-xl border space-y-3 ${rule.isDefault ? 'bg-slate-900/50 border-slate-700/50 border-dashed' : 'bg-slate-900/50 border-slate-700'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rule.isDefault ? 'text-slate-500 bg-slate-500/10 uppercase' : 'text-cyan-500 bg-cyan-500/10'}`}>
                    {rule.isDefault ? 'Default Fallback' : 'IF CONDITION'}
                  </span>
                  <Trash2 onClick={() => deleteRule(rule.id)} className="w-3.5 h-3.5 text-slate-600 hover:text-red-500 cursor-pointer transition-colors" />
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
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500/50 transition-colors"
                  />
                )}
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-2">
                  <ArrowRight size={10} /> GOTO STEP:
                  <select 
                    value={rule.nextStepId || ''}
                    onChange={e => {
                      const newRules = [...rules];
                      newRules[idx].nextStepId = e.target.value || null;
                      setRules(newRules);
                    }}
                    className="bg-transparent border-none text-slate-200 outline-none p-0 cursor-pointer"
                  >
                    <option value="">Select a step</option>
                    {nodes.filter(n => n.id !== selectedNode.id && n.id.length > 15).map(n => (
                      <option key={n.id} value={n.id}>{n.data?.label || 'Unnamed Step'}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => saveRule(rules[idx])}
                  className="w-full mt-2 py-1.5 rounded-lg bg-cyan-600/10 text-cyan-500 hover:bg-cyan-600/20 transition-all text-[10px] font-bold"
                >
                  Save Rule
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-slate-700/50 grid grid-cols-2 gap-4">
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
