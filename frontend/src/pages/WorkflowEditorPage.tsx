import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { stepApi } from '../api/step.api';
import { ruleApi } from '../api/rule.api';
import { toast } from 'sonner';
import { ChevronLeft, Play, Save, Plus, Pencil, Trash2, ChevronUp, ChevronDown, X, GripVertical } from 'lucide-react';

/* ─────────────────────────────────── STEP BADGES ─────────────────────────────────── */
const STEP_STYLES: Record<string, { bg: string; label: string }> = {
  APPROVAL:     { bg: 'bg-amber-500/15 text-amber-400 border border-amber-500/20', label: '✓ APPROVAL' },
  NOTIFICATION: { bg: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',     label: '🔔 NOTIF' },
  TASK:         { bg: 'bg-violet-500/15 text-violet-400 border border-violet-500/20', label: '⚙ TASK' },
};
const getStyle = (t: string) => STEP_STYLES[t?.toUpperCase()] || STEP_STYLES.TASK;

/* ═══════════════════════════════════ COMPONENT ═══════════════════════════════════ */
const WorkflowEditorPage: React.FC = () => {
  const { id: wfId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ── core data ──
  const [workflow, setWorkflow] = useState<any>(null);
  const [steps, setSteps]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // ── selected step & its rules ──
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [rules, setRules] = useState<any[]>([]);

  // ── inline form toggles ──
  const [addingStep, setAddingStep]   = useState(false);
  const [editStep, setEditStep]       = useState<any>(null);
  const [addingRule, setAddingRule]    = useState(false);
  const [editRule, setEditRule]       = useState<any>(null);
  const [addingField, setAddingField] = useState(false);
  const [editField, setEditField]     = useState<string | null>(null);

  // ── form values ──
  const [sf, setSf] = useState({ name: '', stepType: 'TASK' });
  const [rf, setRf] = useState({ priority: 1, condition: '', nextStepId: '', isDefault: false });
  const [ff, setFf] = useState({ name: '', type: 'string', required: true, allowedValues: '' });

  // ── inline name edit ──
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  /* ── loaders ── */
  const load = useCallback(async () => {
    if (!wfId) return;
    setLoading(true);
    setError(null);
    try {
      const [wRes, sRes] = await Promise.all([
        api.get(`/workflows/${wfId}`),
        stepApi.getSteps(wfId),
      ]);
      setWorkflow(wRes.data.data);
      setSteps(sRes.data.data || []);
    } catch (e: any) {
      console.error('Failed to load workflow:', e);
      setError(e.response?.data?.message || 'Failed to load workflow data. It may have been deleted or you may not have permission.');
      toast.error('Load failed');
    } finally {
      setLoading(false);
    }
  }, [wfId]);

  const loadRules = useCallback(async (stepId: string) => {
    if (!wfId) return;
    try { const r = await ruleApi.getRules(wfId, stepId); setRules(r.data.data || []); }
    catch { setRules([]); }
  }, [wfId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (selectedStepId) loadRules(selectedStepId); else setRules([]); }, [selectedStepId, loadRules]);

  /* ── step CRUD ── */
  const saveStep = async () => {
    if (!wfId || !sf.name.trim()) { toast.error('Enter a step name'); return; }
    try {
      if (editStep) {
        await stepApi.updateStep(wfId, editStep.id, { name: sf.name, stepType: sf.stepType, metadata: editStep.metadata || {} });
        toast.success('Step updated');
      } else {
        await stepApi.createStep(wfId, { name: sf.name, stepType: sf.stepType, stepOrder: steps.length + 1 });
        toast.success('Step added');
      }
      setAddingStep(false); setEditStep(null); setSf({ name: '', stepType: 'TASK' });
      const r = await stepApi.getSteps(wfId); setSteps(r.data.data || []);
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const deleteStep = async (s: any) => {
    if (!wfId || !confirm(`Delete "${s.name}"? Its rules will also be removed.`)) return;
    try {
      await stepApi.deleteStep(wfId, s.id); toast.success('Deleted');
      if (selectedStepId === s.id) { setSelectedStepId(null); setRules([]); }
      const r = await stepApi.getSteps(wfId); setSteps(r.data.data || []);
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  /* ── rule CRUD ── */
  const saveRule = async () => {
    if (!wfId || !selectedStepId) return;
    const payload = {
      condition: rf.isDefault ? 'DEFAULT' : rf.condition,
      nextStepId: !rf.nextStepId || rf.nextStepId === '__end__' ? null : rf.nextStepId,
      priority: rf.priority, isDefault: rf.isDefault,
    };
    try {
      if (editRule) { await ruleApi.updateRule(wfId, selectedStepId, editRule.id, payload); toast.success('Rule updated'); }
      else { await ruleApi.createRule(wfId, selectedStepId, payload); toast.success('Rule added'); }
      setAddingRule(false); setEditRule(null);
      await loadRules(selectedStepId);
      setRf({ priority: rules.length + 2, condition: '', nextStepId: '', isDefault: false });
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const deleteRule = async (id: string) => {
    if (!wfId || !selectedStepId || !confirm('Delete this rule?')) return;
    try { await ruleApi.deleteRule(wfId, selectedStepId, id); toast.success('Deleted'); await loadRules(selectedStepId); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const moveRule = async (i: number, dir: 'up' | 'down') => {
    if (!wfId || !selectedStepId) return;
    const n = [...rules]; const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    try { await ruleApi.reorderRules(wfId, selectedStepId, { ruleIds: n.map(r => r.id) }); await loadRules(selectedStepId); }
    catch { toast.error('Reorder failed'); }
  };

  /* ── schema CRUD ── */
  const schema = workflow?.inputSchema || {};
  const fields = Object.entries(schema).map(([k, v]: [string, any]) => ({
    name: k, type: v.type || 'string', required: v.required ?? false,
    allowed: v.allowedValues || v.allowed_values || v.enum || [],
  }));

  const putSchema = async (s: any) => {
    if (!wfId || !workflow) return;
    try {
      await api.put(`/workflows/${wfId}`, { name: workflow.name, description: workflow.description || '', status: workflow.status, inputSchema: s });
      const r = await api.get(`/workflows/${wfId}`); setWorkflow(r.data.data); toast.success('Schema saved');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const saveField = async () => {
    if (!ff.name.trim()) { toast.error('Enter field name'); return; }
    const s = { ...schema };
    const def: any = { type: ff.type, required: ff.required };
    if (ff.type === 'string' && ff.allowedValues.trim()) def.allowedValues = ff.allowedValues.split(',').map((x: string) => x.trim()).filter(Boolean);
    s[ff.name] = def;
    await putSchema(s);
    setAddingField(false); setEditField(null); setFf({ name: '', type: 'string', required: true, allowedValues: '' });
  };

  const deleteField = async (n: string) => {
    if (!confirm(`Remove "${n}"?`)) return;
    const s = { ...schema }; delete s[n]; await putSchema(s);
  };

  /* ── publish / test ── */
  const publish = async () => {
    if (!wfId || !workflow) return;
    try {
      await api.put(`/workflows/${wfId}`, { name: workflow.name, description: workflow.description || '', status: 'ACTIVE', inputSchema: workflow.inputSchema || {} });
      toast.success('Published!'); const r = await api.get(`/workflows/${wfId}`); setWorkflow(r.data.data);
    } catch (e: any) { toast.error(e.response?.data?.message || 'Publish failed'); }
  };

  const selectedStep = steps.find(s => s.id === selectedStepId);

  if (loading) return <div className="flex items-center justify-center h-96 text-[#525252] text-sm animate-pulse font-mono uppercase tracking-widest">Loading workflow editor…</div>;

  if (error) return (
    <div className="flex flex-col items-center justify-center h-96 space-y-6">
      <div className="text-red-400 font-mono text-sm bg-red-500/10 border border-red-500/20 p-6 rounded-xl max-w-md text-center">
        <p className="font-bold mb-2 tracking-widest uppercase">⚠ LOAD ERROR</p>
        <p className="text-[#a1a1a1]">{error}</p>
      </div>
      <Link to="/workflows" className="text-amber-400 hover:text-amber-300 text-xs font-bold uppercase tracking-widest border border-amber-500/20 bg-amber-500/5 px-6 py-2 rounded-lg transition-all">
        [ ← Back to Workflows ]
      </Link>
    </div>
  );

  /* ── auto calculate stats (mocked as requested or fetched if existed) ── */
  const runs = workflow?.totalExecutions || 0;
  const successRate = workflow?.successRate || 0;
  const avgTime = workflow?.averageDuration || '0s';

  const handleNameSave = async () => {
    if (!tempName.trim()) { setEditingName(false); return; }
    await putSchema(workflow.inputSchema); // we cheat and use putSchema which also sends workflow name
    setEditingName(false);
  };
  
  // Custom putSchema that respects updated name
  const _putSchemaCustom = async (s: any, newName: string = workflow.name) => {
    if (!wfId || !workflow) return;
    try {
      await api.put(`/workflows/${wfId}`, { name: newName, description: workflow.description || '', status: workflow.status, inputSchema: s });
      const r = await api.get(`/workflows/${wfId}`); setWorkflow(r.data.data); toast.success('Saved');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
  };


  /* ═══════════════════════════════════ RENDER ═══════════════════════════════════ */
  return (
    <div className="max-w-5xl mx-auto pb-24 -mt-2 font-sans">

      {/* ━━━━━━━━━━━━━ HEADER BAR ━━━━━━━━━━━━━ */}
      <div className="flex items-center justify-between py-4 border-b border-white/[0.06] mb-8 mt-4">
        <div className="flex items-center gap-3">
          <Link to="/workflows" className="text-[#a1a1a1] hover:text-[#fafafa] transition-colors flex items-center gap-1">
            <ChevronLeft size={16} /> <span className="text-sm font-medium">Workflows</span>
          </Link>
          <span className="text-[#525252] text-sm">/</span>
          
          <div className="flex items-center gap-3">
            {editingName ? (
              <input 
                autoFocus 
                value={tempName} 
                onChange={e => setTempName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={e => e.key === 'Enter' && handleNameSave()}
                className="bg-[#141414] border border-white/[0.10] rounded px-2 py-1 text-sm text-[#fafafa] font-medium outline-none focus:border-amber-500/50"
              />
            ) : (
              <h1 
                onClick={() => { setTempName(workflow?.name || ''); setEditingName(true); }}
                className="text-lg font-semibold text-[#fafafa] cursor-pointer hover:bg-white/[0.04] px-2 py-1 -ml-2 rounded transition-colors tracking-tight"
              >
                {workflow?.name}
              </h1>
            )}
            
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[#a1a1a1]">
              v{workflow?.version || 1}
            </span>
            
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${workflow?.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
              {workflow?.status || 'DRAFT'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 text-xs text-[#a1a1a1] font-medium hidden md:flex uppercase tracking-wider">
            <span>Runs: <span className="text-[#fafafa]">{runs}</span></span>
            <span className="text-[#3a3a3a]">|</span>
            <span>Rate: <span className="text-[#fafafa]">{successRate}%</span></span>
            <span className="text-[#3a3a3a]">|</span>
            <span>Avg: <span className="text-[#fafafa]">{avgTime}</span></span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={publish}
              className="bg-[#fafafa] hover:bg-[#e5e5e5] text-black font-semibold px-4 py-1.5 rounded-lg text-xs transition-colors">
              Publish
            </button>
            <button onClick={() => navigate(`/workflows/${wfId}/execute`)}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5">
              <Play size={12} className="fill-amber-500" /> Test Run
            </button>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━ INPUT SCHEMA ━━━━━━━━━━━━━ */}
      <section className="mb-12">
        <div className="bg-[#0e0e0e] border border-white/[0.06] rounded-xl overflow-hidden shadow-2xl">
          <div className="bg-[#080808] border-b border-white/[0.04] px-5 py-3 flex items-center justify-between">
            <h2 className="text-[#fafafa] text-sm font-semibold tracking-tight">Input Schema</h2>
            <button onClick={() => { setAddingField(true); setEditField(null); setFf({ name: '', type: 'string', required: true, allowedValues: '' }); }}
              className="text-xs font-medium text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1">
              <Plus size={14} /> Add Field
            </button>
          </div>
          
          <div className="divide-y divide-white/[0.03]">
            {fields.length === 0 && !addingField && (
              <p className="px-5 py-8 text-center text-sm text-[#525252]">No fields defined yet. Click Add Field to construct the input schema.</p>
            )}
            {fields.map(f => (
              <div key={f.name} className="flex items-center px-5 py-3 xl:py-4 hover:bg-white/[0.02] transition-colors group">
                <div className="w-6 shrink-0 flex justify-start text-[#3a3a3a] group-hover:text-amber-500/50 transition-colors">⬡</div>
                <div className="w-40 font-mono text-sm text-[#fafafa]">{f.name}</div>
                <div className="w-24 pl-4"><span className="bg-white/[0.04] border border-white/[0.08] text-[#a1a1a1] font-mono text-[10px] px-2 py-0.5 rounded tracking-widest">{f.type.toUpperCase()}</span></div>
                <div className="w-32 pl-4 flex items-center">
                  <span className={`w-1.5 h-1.5 rounded-full mr-2 ${f.required ? 'bg-amber-500' : 'bg-[#3a3a3a]'}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${f.required ? 'text-amber-500' : 'text-[#525252]'}`}>{f.required ? 'REQUIRED' : 'OPTIONAL'}</span>
                </div>
                <div className="flex-1 pl-4">
                  {f.allowed.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {f.allowed.map((val: string) => <span key={val} className="text-[10px] bg-white/[0.04] text-[#a1a1a1] border border-white/[0.08] rounded px-1.5 py-0.5">{val}</span>)}
                    </div>
                  ) : <span className="text-[#3a3a3a]">—</span>}
                </div>
                <div className="w-20 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditField(f.name); setFf({ name: f.name, type: f.type, required: f.required, allowedValues: f.allowed.join(', ') }); setAddingField(true); }}
                    className="text-[#525252] hover:text-amber-400 transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => deleteField(f.name)}
                    className="text-[#525252] hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>

          {addingField && (
            <div className="p-5 bg-[#0a0a0a] border-t border-white/[0.04] inset-shadow">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[10px] font-medium text-[#a1a1a1] uppercase tracking-wider mb-1.5">Field Name</label>
                  <input autoFocus placeholder="e.g. amount" value={ff.name} disabled={!!editField}
                    onChange={e => setFf({ ...ff, name: e.target.value })}
                    className="w-full bg-[#141414] border border-white/[0.10] rounded-lg px-3 py-2 text-sm text-[#fafafa] font-mono placeholder-[#525252] outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all" />
                </div>
                <div className="w-32">
                  <label className="block text-[10px] font-medium text-[#a1a1a1] uppercase tracking-wider mb-1.5">Type</label>
                  <select value={ff.type} onChange={e => setFf({ ...ff, type: e.target.value })}
                    className="w-full bg-[#141414] border border-white/[0.10] rounded-lg px-2 py-2 text-sm font-mono text-[#fafafa] outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all">
                    <option value="string">STRING</option><option value="number">NUMBER</option><option value="boolean">BOOLEAN</option>
                  </select>
                </div>
                <div className="w-32 flex items-center h-[38px] px-3 bg-[#141414] border border-white/[0.10] rounded-lg cursor-pointer hover:border-white/[0.15] transition-all" onClick={() => setFf({ ...ff, required: !ff.required })}>
                   <input type="checkbox" checked={ff.required} readOnly className="accent-amber-500 w-3.5 h-3.5 rounded mr-2 pointer-events-none" />
                   <span className="text-[10px] font-bold text-[#fafafa] uppercase tracking-wider select-none">Required</span>
                </div>
              </div>
              
              {ff.type === 'string' && (
                <div className="mt-4">
                  <label className="block text-[10px] font-medium text-[#a1a1a1] uppercase tracking-wider mb-1.5">Allowed Values (Comma separated)</label>
                  <input placeholder="e.g., Engineering, Sales, HR" value={ff.allowedValues}
                    onChange={e => setFf({ ...ff, allowedValues: e.target.value })}
                    className="w-full bg-[#141414] border border-white/[0.10] rounded-lg px-3 py-2 text-sm text-[#fafafa] placeholder-[#525252] outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all" />
                </div>
              )}
              
              <div className="flex justify-end gap-3 mt-5">
                <button onClick={() => { setAddingField(false); setEditField(null); }} className="px-4 py-1.5 text-xs text-[#a1a1a1] hover:text-[#fafafa] transition-colors rounded-lg hover:bg-white/[0.04]">Cancel</button>
                <button onClick={saveField} className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-1.5 rounded-lg text-xs transition-colors">Save Field</button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━ STEPS ━━━━━━━━━━━━━ */}
      <section className="mb-12">
        <div id="steps-container" className="bg-[#0e0e0e] border border-white/[0.06] rounded-xl overflow-hidden shadow-2xl">
          <div className="bg-[#080808] border-b border-white/[0.04] px-5 py-3 flex items-center justify-between">
            <h2 className="text-[#fafafa] text-sm font-semibold tracking-tight">Steps</h2>
            <button onClick={() => { setAddingStep(true); setEditStep(null); setSf({ name: '', stepType: 'TASK' }); }}
              className="text-xs font-medium text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1">
              <Plus size={14} /> Add Step
            </button>
          </div>
          
          <div className="divide-y divide-white/[0.03]">
            {steps.length === 0 && !addingStep && (
              <p className="px-5 py-8 text-center text-sm text-[#525252]">No steps yet. Click Add Step to build workflow.</p>
            )}
            {steps.map((s: any, i: number) => {
              const st = getStyle(s.type || s.stepType);
              const active = selectedStepId === s.id;
              return (
                <div key={s.id}
                  onClick={() => setSelectedStepId(active ? null : s.id)}
                  className={`flex items-center px-5 py-3 xl:py-4 cursor-pointer transition-colors group text-sm
                    ${active ? 'bg-amber-500/[0.04]' : 'hover:bg-white/[0.02]'}`}>
                  
                  <div className="w-8 text-[#525252] font-mono text-xs">{i + 1}</div>
                  
                  <div className="w-36">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${st.bg}`}>
                      {st.label}
                    </span>
                  </div>
                  
                  <div className="flex-1 text-[#fafafa] font-medium pl-4">{s.name}</div>
                  
                  <div className="w-24 flex items-center gap-2">
                    {active ? (
                      <span className="text-amber-500 text-xs font-semibold tracking-wide flex items-center gap-1">
                        Rules <ChevronUp size={14}/>
                      </span>
                    ) : (
                      <span className="text-[#525252] text-xs font-medium tracking-wide flex items-center gap-1 group-hover:text-[#a1a1a1] transition-colors">
                        Rules <ChevronDown size={14}/>
                      </span>
                    )}
                  </div>
                  
                  <div className="w-16 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); setEditStep(s); setSf({ name: s.name, stepType: s.type || s.stepType }); setAddingStep(true); }}
                      className="text-[#525252] hover:text-amber-400 transition-colors"><Pencil size={14} /></button>
                    <button onClick={e => { e.stopPropagation(); deleteStep(s); }}
                      className="text-[#525252] hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>

          {addingStep && (
            <div className="p-5 bg-[#0a0a0a] border-t border-white/[0.04] inset-shadow">
              <label className="block text-[10px] font-medium text-[#a1a1a1] uppercase tracking-wider mb-2">Step Name</label>
              <input autoFocus placeholder="e.g. Initial Check" value={sf.name}
                onChange={e => setSf({ ...sf, name: e.target.value })}
                className="w-full max-w-sm bg-[#141414] border border-white/[0.10] rounded-lg px-3 py-2 text-sm text-[#fafafa] placeholder-[#525252] outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 mb-6 transition-all" />
              
              <label className="block text-[10px] font-medium text-[#a1a1a1] uppercase tracking-wider mb-2">Step Type</label>
              <div className="flex gap-4 mb-6">
                {[
                  { val: 'TASK', icon: '⚙', name: 'TASK', desc: 'Automated action' },
                  { val: 'APPROVAL', icon: '✓', name: 'APPROVAL', desc: 'Human step' },
                  { val: 'NOTIFICATION', icon: '🔔', name: 'NOTIFICATION', desc: 'Send alert' }
                ].map(t => (
                  <div key={t.val} onClick={() => setSf({...sf, stepType: t.val})}
                    className={`cursor-pointer border rounded-xl p-3 w-36 text-center transition-all duration-200 ${sf.stepType === t.val ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/[0.08] bg-[#141414] hover:border-white/[0.15]'}`}>
                    <div className="text-xl mb-1.5 opacity-80">{t.icon}</div>
                    <div className="text-[10px] font-bold text-[#fafafa] tracking-wider mb-1 select-none">{t.name}</div>
                    <div className="text-[10px] text-[#525252] leading-tight">{t.desc}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setAddingStep(false); setEditStep(null); }} className="px-4 py-1.5 text-xs text-[#a1a1a1] hover:text-[#fafafa] transition-colors rounded-lg hover:bg-white/[0.04]">Cancel</button>
                <button onClick={saveStep} className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-1.5 rounded-lg text-xs transition-colors">{editStep ? 'Save Step' : 'Add Step'}</button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━ RULES ━━━━━━━━━━━━━ */}
      {selectedStep && (
        <section className="mt-4 mb-16 animate-in fade-in duration-300 relative">
          <div className="absolute -top-12 left-8 w-px h-12 bg-white/[0.06] block z-0"></div>
          
          <div className="bg-[#0e0e0e] border border-amber-500/30 rounded-xl overflow-hidden shadow-2xl relative z-10 ml-12">
            <div className="bg-[#080808] border-b border-white/[0.04] px-5 py-3 flex items-center justify-between">
              <h2 className="text-[#fafafa] text-sm font-semibold tracking-tight flex items-center gap-2">
                Rules Engine <span className="text-[#525252] font-normal mx-1">/</span> <span className="text-amber-500 font-medium">{selectedStep.name}</span>
              </h2>
              <button onClick={() => { setAddingRule(true); setEditRule(null); setRf({ priority: rules.length + 1, condition: '', nextStepId: '', isDefault: false }); }}
                className="text-xs font-medium text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1">
                <Plus size={14} /> Add Rule
              </button>
            </div>
            
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.04] bg-[#0a0a0a] text-[10px] text-[#a1a1a1] uppercase tracking-wider font-semibold">
                  <th className="px-5 py-2.5 w-12 text-center">Ord</th>
                  <th className="px-5 py-2.5">Condition Expression</th>
                  <th className="px-5 py-2.5">Next Step Directive</th>
                  <th className="px-5 py-2.5 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03] text-sm">
                {rules.length === 0 && !addingRule && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-[#525252]">No rules defined for this step.</td></tr>
                )}
                {rules.map((r: any, i: number) => {
                  const next = steps.find(s => s.id === r.nextStepId);
                  const st = next ? getStyle(next.type || next.stepType) : null;
                  return (
                    <tr key={r.id} className="hover:bg-white/[0.02] group transition-colors">
                      <td className="px-5 py-3.5 text-[#525252] font-mono text-center text-xs">{i + 1}</td>
                      <td className="px-5 py-3.5">
                        {r.isDefault || r.condition === 'DEFAULT' ? (
                          <div className="inline-block px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.04] text-[#a1a1a1] text-[10px] font-mono font-bold tracking-widest uppercase">
                            Default Fallback
                          </div>
                        ) : (
                          <div className="font-mono text-amber-500/80 text-sm">{r.condition}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {next ? (
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] tracking-wider font-bold uppercase ${st?.bg}`}>
                            {next.name}
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] tracking-wider font-bold uppercase border border-red-500/20 bg-red-500/10 text-red-400">
                            End Workflow
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right group-hover:opacity-100 opacity-0 transition-opacity">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => { setEditRule(r); setRf({ priority: r.priority || i + 1, condition: r.condition === 'DEFAULT' ? '' : (r.condition || ''), nextStepId: r.nextStepId || '__end__', isDefault: !!(r.isDefault || r.condition === 'DEFAULT') }); setAddingRule(true); }} className="text-[#525252] hover:text-amber-400 transition-colors"><Pencil size={14} /></button>
                          <button onClick={() => deleteRule(r.id)} className="text-[#525252] hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {addingRule && (
              <div className="p-5 bg-[#0a0a0a] border-t border-white/[0.04] grid grid-cols-12 gap-6 inset-shadow">
                <div className="col-span-12 md:col-span-8 space-y-4 pr-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[10px] font-medium text-[#a1a1a1] uppercase tracking-wider block">Condition Expression</label>
                      <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold tracking-wider text-[#fafafa] uppercase">
                        <input type="checkbox" checked={rf.isDefault} onChange={e => setRf({ ...rf, isDefault: e.target.checked })} className="accent-amber-500 w-3.5 h-3.5 rounded" /> 
                        Set as Default
                      </label>
                    </div>
                    <input placeholder="amount > 100 && country == 'INDIA'" value={rf.condition} disabled={rf.isDefault}
                      onChange={e => setRf({ ...rf, condition: e.target.value })}
                      className="w-full bg-[#141414] border border-white/[0.10] rounded-lg px-3 py-2 text-sm text-amber-500 font-mono placeholder-[#525252] outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 disabled:opacity-30 disabled:font-sans transition-all" />
                    {!rf.isDefault && <p className="text-[10px] text-[#525252] mt-1.5 font-mono">Hint: Use {"&&, ||, ==, !=, <, >, <=, >="} operators</p>}
                  </div>
                </div>
                
                <div className="col-span-12 md:col-span-4 flex flex-col justify-between">
                  <div>
                    <label className="text-[10px] font-medium text-[#a1a1a1] uppercase tracking-wider block mb-1.5">Next Step Directive</label>
                    <select value={rf.nextStepId} onChange={e => setRf({ ...rf, nextStepId: e.target.value })}
                      className="w-full bg-[#141414] border border-white/[0.10] rounded-lg px-2 py-2 text-sm text-[#fafafa] font-medium outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all">
                      <option value="">[ Select step ... ]</option>
                      <option value="__end__">✖ End Workflow (Terminate)</option>
                      {steps.filter(s => s.id !== selectedStepId).map(s => <option key={s.id} value={s.id}>→ {s.name}</option>)}
                    </select>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-5 pt-1">
                    <button onClick={() => { setAddingRule(false); setEditRule(null); }} className="px-4 py-1.5 text-xs text-[#a1a1a1] hover:text-[#fafafa] transition-colors rounded-lg hover:bg-white/[0.04]">Cancel</button>
                    <button onClick={saveRule} className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-1.5 rounded-lg text-xs transition-colors">{editRule ? 'Update Rule' : 'Save Rule'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ━━━━━━━━━━━━━ VISUAL PREVIEW ━━━━━━━━━━━━━ */}
      {steps.length > 0 && (
        <section className="mt-16 pt-8 flex flex-col items-center select-none text-sm font-mono pb-20 relative">
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#080808] to-[#080808] z-0 pointer-events-none" />
           <h2 className="text-[10px] font-bold text-[#525252] uppercase tracking-[0.2em] mb-8 text-center relative z-10">Visual Execution Flow</h2>
           
           <div className="flex flex-col items-center justify-center space-y-0 text-center w-full relative z-10">
               {steps.map((s, idx) => {
                 const st = getStyle(s.type || s.stepType);
                 return (
                   <React.Fragment key={s.id}>
                     <div className={`px-4 py-2 border rounded-lg shadow-xl ${st.bg} inline-block min-w-[200px] bg-[#0e0e0e]`}>
                       <span className="font-bold tracking-wider text-xs">{st.label.replace('✓', '').replace('🔔', '').replace('⚙', '').trim()} — {s.name}</span>
                     </div>
                     {idx < steps.length - 1 && (
                       <div className="flex flex-col items-center">
                          <div className="w-px h-6 bg-white/[0.10] block my-1"></div>
                          <div className="text-[10px] text-[#A1A1A1] bg-[#141414] px-2 py-0.5 rounded-full border border-white/[0.08] uppercase scale-75 whitespace-nowrap -my-2 flex items-center justify-center z-10 w-auto font-sans tracking-widest font-bold">
                            Rules Evaluated
                          </div>
                          <div className="w-px h-6 bg-white/[0.10] block my-1"></div>
                          <div className="text-white/[0.20] -mt-1 -mb-1 text-sm">▼</div>
                       </div>
                     )}
                   </React.Fragment>
                 )
               })}
               <div className="flex flex-col items-center">
                  <div className="w-px h-6 bg-white/[0.10] block my-1"></div>
                  <div className="text-white/[0.20] -mt-1 -mb-1 text-sm">▼</div>
               </div>
               <div className="px-4 py-2 border rounded-lg border-red-500/20 bg-[#0e0e0e] text-red-400 shadow-xl inline-block min-w-[100px] text-xs font-bold tracking-widest uppercase">
                  End
               </div>
           </div>
        </section>
      )}
    </div>
  );
};

export default WorkflowEditorPage;

