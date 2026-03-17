import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { stepApi } from '../api/step.api';
import { ruleApi } from '../api/rule.api';
import { toast } from 'sonner';
import { ChevronLeft, Play, Save, Plus, Pencil, Trash2, ChevronUp, ChevronDown, X, GripVertical } from 'lucide-react';

/* ─────────────────────────────────── STEP BADGES ─────────────────────────────────── */
const STEP_STYLES: Record<string, { bg: string; label: string }> = {
  APPROVAL:     { bg: 'bg-orange-500/20 text-orange-300 border-orange-500/30', label: 'approval' },
  NOTIFICATION: { bg: 'bg-teal-500/20 text-teal-300 border-teal-500/30',     label: 'notification' },
  TASK:         { bg: 'bg-violet-500/20 text-violet-300 border-violet-500/30', label: 'task' },
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

  /* ── loaders ── */
  const load = useCallback(async () => {
    if (!wfId) return;
    setLoading(true);
    const [wRes, sRes] = await Promise.all([
      api.get(`/workflows/${wfId}`),
      stepApi.getSteps(wfId),
    ]);
    setWorkflow(wRes.data.data);
    setSteps(sRes.data.data || []);
    setLoading(false);
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

  if (loading) return <div className="flex items-center justify-center h-96 text-slate-500 text-sm animate-pulse">Loading workflow editor…</div>;

  /* ═══════════════════════════════════ RENDER ═══════════════════════════════════ */
  return (
    <div className="max-w-4xl mx-auto pb-16 -mt-2">

      {/* ━━━━━━━━━━━━━ HEADER ━━━━━━━━━━━━━ */}
      <div className="flex items-center justify-between py-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Link to="/workflows" className="p-2 -ml-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /></Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold text-white tracking-tight">{workflow?.name}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/20">v{workflow?.version || 1}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${workflow?.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/15 text-amber-400 border-amber-500/20'}`}>
                {workflow?.status || 'DRAFT'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{steps.length} step{steps.length !== 1 ? 's' : ''} · {fields.length} input field{fields.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/workflows/${wfId}/execute`)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
            <Play size={13} className="fill-emerald-400" /> Test Run
          </button>
          <button onClick={publish}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/30">
            <Save size={13} /> Publish
          </button>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━ INPUT SCHEMA ━━━━━━━━━━━━━ */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em]">Input Schema</h2>
          <button onClick={() => { setAddingField(true); setEditField(null); setFf({ name: '', type: 'string', required: true, allowedValues: '' }); }}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
            <Plus size={13} /> Add Field
          </button>
        </div>
        <div className="rounded-xl border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
          {fields.length === 0 && !addingField && (
            <p className="px-5 py-10 text-center text-sm text-slate-600 italic">No input fields defined yet.</p>
          )}
          {fields.map(f => (
            <div key={f.name} className="flex items-center px-5 py-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
              <span className="w-40 text-sm text-white font-medium truncate">{f.name}</span>
              <span className="w-20 text-sm text-slate-400">{f.type}</span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded mr-4 ${f.required ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-slate-500'}`}>
                {f.required ? 'required' : 'optional'}
              </span>
              {f.allowed.length > 0 && <span className="text-xs text-slate-500 truncate">{f.allowed.join(' | ')}</span>}
              <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditField(f.name); setFf({ name: f.name, type: f.type, required: f.required, allowedValues: f.allowed.join(', ') }); setAddingField(true); }}
                  className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 transition-colors"><Pencil size={13} /></button>
                <button onClick={() => deleteField(f.name)}
                  className="p-1.5 rounded-md hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
          {addingField && (
            <div className="px-5 py-4 bg-white/[0.03] space-y-3 animate-in fade-in duration-200">
              <div className="flex gap-3 items-center">
                <input autoFocus placeholder="Field name" value={ff.name} disabled={!!editField}
                  onChange={e => setFf({ ...ff, name: e.target.value })}
                  className="flex-[2] bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/40 transition-colors disabled:opacity-50" />
                <select value={ff.type} onChange={e => setFf({ ...ff, type: e.target.value })}
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors">
                  <option value="string">string</option><option value="number">number</option><option value="boolean">boolean</option><option value="date">date</option>
                </select>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none whitespace-nowrap">
                  <input type="checkbox" checked={ff.required} onChange={e => setFf({ ...ff, required: e.target.checked })} className="accent-indigo-500 w-4 h-4 rounded" /> Required
                </label>
              </div>
              {ff.type === 'string' && (
                <input placeholder="Allowed values (comma-separated, e.g. High, Medium, Low)" value={ff.allowedValues}
                  onChange={e => setFf({ ...ff, allowedValues: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/40 transition-colors" />
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={saveField} className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all">
                  {editField ? 'Update' : 'Save'}
                </button>
                <button onClick={() => { setAddingField(false); setEditField(null); }} className="px-4 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━ STEPS ━━━━━━━━━━━━━ */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em]">Steps</h2>
          <button onClick={() => { setAddingStep(true); setEditStep(null); setSf({ name: '', stepType: 'TASK' }); }}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
            <Plus size={13} /> Add Step
          </button>
        </div>
        <div className="rounded-xl border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
          {steps.length === 0 && !addingStep && (
            <p className="px-5 py-10 text-center text-sm text-slate-600 italic">No steps yet. Click "Add Step" to get started.</p>
          )}
          {steps.map((s: any, i: number) => {
            const st = getStyle(s.type || s.stepType);
            const active = selectedStepId === s.id;
            return (
              <div key={s.id}
                onClick={() => setSelectedStepId(active ? null : s.id)}
                className={`flex items-center px-5 py-3.5 cursor-pointer transition-all group
                  ${active ? 'bg-indigo-500/[0.06] border-l-2 border-l-indigo-500' : 'bg-white/[0.02] hover:bg-white/[0.04] border-l-2 border-l-transparent'}`}>
                <span className="text-slate-500 font-mono text-xs w-7 text-right mr-4">{i + 1}.</span>
                <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold border mr-4 ${st.bg}`}>
                  {st.label}
                </span>
                <span className="text-white font-medium text-sm flex-1">{s.name}</span>
                <div className="flex items-center gap-1.5">
                  <button onClick={e => { e.stopPropagation(); setSelectedStepId(s.id); }}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all
                      ${active ? 'bg-indigo-500/25 text-indigo-300' : 'bg-white/5 text-slate-400 hover:bg-indigo-500/15 hover:text-indigo-300'}`}>
                    Rules
                  </button>
                  <button onClick={e => { e.stopPropagation(); setEditStep(s); setSf({ name: s.name, stepType: s.type || s.stepType }); setAddingStep(true); }}
                    className="p-1.5 rounded-md hover:bg-white/10 text-slate-500 opacity-0 group-hover:opacity-100 transition-all"><Pencil size={13} /></button>
                  <button onClick={e => { e.stopPropagation(); deleteStep(s); }}
                    className="p-1.5 rounded-md hover:bg-red-500/15 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={13} /></button>
                </div>
              </div>
            );
          })}
          {addingStep && (
            <div className="px-5 py-4 bg-white/[0.03] space-y-3 animate-in fade-in duration-200">
              <div className="flex gap-3">
                <input autoFocus placeholder="Step name (e.g. Manager Approval)" value={sf.name}
                  onChange={e => setSf({ ...sf, name: e.target.value })}
                  className="flex-[3] bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/40 transition-colors" />
                <select value={sf.stepType} onChange={e => setSf({ ...sf, stepType: e.target.value })}
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors">
                  <option value="TASK">Task</option><option value="APPROVAL">Approval</option><option value="NOTIFICATION">Notification</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={saveStep} className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all">
                  {editStep ? 'Update Step' : 'Add Step'}
                </button>
                <button onClick={() => { setAddingStep(false); setEditStep(null); }} className="px-4 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━ RULES ━━━━━━━━━━━━━ */}
      {selectedStep && (
        <section className="mt-10 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em]">
              Rules for: <span className="text-white ml-1">{selectedStep.name}</span>
            </h2>
            <button onClick={() => { setAddingRule(true); setEditRule(null); setRf({ priority: rules.length + 1, condition: '', nextStepId: '', isDefault: false }); }}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              <Plus size={13} /> Add Rule
            </button>
          </div>
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            {/* header */}
            <div className="grid grid-cols-12 px-5 py-2.5 bg-white/[0.03] text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em] border-b border-white/[0.04]">
              <div className="col-span-1">P</div>
              <div className="col-span-6">Condition</div>
              <div className="col-span-3">Next Step</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {rules.length === 0 && !addingRule && (
              <p className="px-5 py-8 text-center text-sm text-slate-600 italic">No rules yet. Add a rule to control step routing.</p>
            )}
            {rules.map((r: any, i: number) => {
              const next = steps.find(s => s.id === r.nextStepId);
              return (
                <div key={r.id} className="grid grid-cols-12 items-center px-5 py-3 bg-white/[0.02] hover:bg-white/[0.04] border-b border-white/[0.04] transition-colors group text-sm">
                  <div className="col-span-1 text-slate-500 font-mono text-xs">{i + 1}</div>
                  <div className="col-span-6">
                    {r.isDefault || r.condition === 'DEFAULT'
                      ? <span className="px-2.5 py-0.5 rounded bg-slate-700/40 text-slate-400 text-[10px] font-bold uppercase">DEFAULT</span>
                      : <code className="text-cyan-300 text-xs font-mono">{r.condition}</code>}
                  </div>
                  <div className="col-span-3 text-white text-sm">{next ? next.name : (r.nextStepId ? '—' : <span className="text-slate-400 italic">End workflow</span>)}</div>
                  <div className="col-span-2 flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveRule(i, 'up')} disabled={i === 0}
                      className="p-1 rounded hover:bg-white/10 disabled:opacity-20 text-slate-400"><ChevronUp size={14} /></button>
                    <button onClick={() => moveRule(i, 'down')} disabled={i === rules.length - 1}
                      className="p-1 rounded hover:bg-white/10 disabled:opacity-20 text-slate-400"><ChevronDown size={14} /></button>
                    <button onClick={() => {
                      setEditRule(r);
                      setRf({ priority: r.priority || i + 1, condition: r.condition === 'DEFAULT' ? '' : (r.condition || ''), nextStepId: r.nextStepId || '__end__', isDefault: !!(r.isDefault || r.condition === 'DEFAULT') });
                      setAddingRule(true);
                    }} className="p-1 rounded hover:bg-white/10 text-slate-400"><Pencil size={13} /></button>
                    <button onClick={() => deleteRule(r.id)}
                      className="p-1 rounded hover:bg-red-500/15 text-slate-500 hover:text-red-400"><Trash2 size={13} /></button>
                  </div>
                </div>
              );
            })}
            {addingRule && (
              <div className="px-5 py-4 bg-white/[0.03] space-y-3 animate-in fade-in duration-200">
                <div className="grid grid-cols-12 gap-3 items-start">
                  <input type="number" min={1} value={rf.priority}
                    onChange={e => setRf({ ...rf, priority: +e.target.value })}
                    className="col-span-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-2 text-sm text-white outline-none text-center focus:border-indigo-500/40 transition-colors" />
                  <div className="col-span-6 space-y-2">
                    <input placeholder="amount > 100 && country == 'US'" value={rf.condition}
                      disabled={rf.isDefault}
                      onChange={e => setRf({ ...rf, condition: e.target.value })}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-600 outline-none focus:border-indigo-500/40 transition-colors disabled:opacity-30" />
                    <label className="inline-flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer select-none">
                      <input type="checkbox" checked={rf.isDefault} onChange={e => setRf({ ...rf, isDefault: e.target.checked })} className="accent-indigo-500 w-3.5 h-3.5 rounded" /> DEFAULT (catch-all)
                    </label>
                  </div>
                  <select value={rf.nextStepId} onChange={e => setRf({ ...rf, nextStepId: e.target.value })}
                    className="col-span-3 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors">
                    <option value="">Select next step…</option>
                    <option value="__end__">🏁 End Workflow</option>
                    {steps.filter(s => s.id !== selectedStepId).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <div className="col-span-2 flex gap-2 justify-end">
                    <button onClick={saveRule} className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all">Save</button>
                    <button onClick={() => { setAddingRule(false); setEditRule(null); }} className="p-2 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"><X size={15} /></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default WorkflowEditorPage;
