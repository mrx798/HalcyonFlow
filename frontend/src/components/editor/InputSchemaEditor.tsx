import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Database, ToggleLeft, ToggleRight, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../../api/axios';

interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  allowed_values?: string[];
}

interface InputSchemaEditorProps {
  workflow: any;
  onClose: () => void;
  onSave: (schema: Record<string, any>) => void;
}

const InputSchemaEditor: React.FC<InputSchemaEditorProps> = ({ workflow, onClose, onSave }) => {
  const [fields, setFields] = useState<SchemaField[]>([]);
  const [newAllowedValue, setNewAllowedValue] = useState<Record<number, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const parsed: SchemaField[] = Object.entries(workflow?.inputSchema || {}).map(([name, def]: [string, any]) => ({
      name,
      type: def.type || 'string',
      required: def.required || false,
      allowed_values: def.allowed_values || undefined,
    }));
    setFields(parsed);
  }, [workflow]);

  const addField = () => {
    setFields([...fields, { name: '', type: 'string', required: false }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<SchemaField>) => {
    setFields(fields.map((f, i) => i === index ? { ...f, ...updates } : f));
  };

  const addAllowedValue = (index: number) => {
    const val = newAllowedValue[index]?.trim();
    if (!val) return;
    const field = fields[index];
    const existing = field.allowed_values || [];
    if (existing.includes(val)) return;
    updateField(index, { allowed_values: [...existing, val] });
    setNewAllowedValue({ ...newAllowedValue, [index]: '' });
  };

  const removeAllowedValue = (fieldIndex: number, valIndex: number) => {
    const field = fields[fieldIndex];
    const newVals = (field.allowed_values || []).filter((_, i) => i !== valIndex);
    updateField(fieldIndex, { allowed_values: newVals.length > 0 ? newVals : undefined });
  };

  const handleSave = async () => {
    // Validate
    for (const f of fields) {
      if (!f.name.trim()) {
        toast.error('All fields must have a name');
        return;
      }
    }
    const names = fields.map(f => f.name.trim());
    if (new Set(names).size !== names.length) {
      toast.error('Field names must be unique');
      return;
    }

    // Build schema object
    const schema: Record<string, any> = {};
    fields.forEach(f => {
      const def: any = { type: f.type, required: f.required };
      if (f.allowed_values && f.allowed_values.length > 0) {
        def.allowed_values = f.allowed_values;
      }
      schema[f.name.trim()] = def;
    });

    setIsSaving(true);
    try {
      await api.put(`/workflows/${workflow.id}`, { 
        name: workflow.name,
        description: workflow.description || '',
        status: workflow.status,
        inputSchema: schema 
      });
      toast.success('Input schema saved!');
      onSave(schema);
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save schema');
    } finally {
      setIsSaving(false);
    }
  };

  const typeColors: Record<string, string> = {
    string: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    number: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    boolean: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl glass-card border border-slate-700/50 max-h-[85vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <Database className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Input Schema Builder</h2>
                <p className="text-xs text-slate-500">Define the input fields for workflow execution</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Fields */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {fields.length === 0 && (
              <div className="text-center py-12">
                <Database className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No input fields defined.</p>
                <p className="text-slate-600 text-xs mt-1">Add fields to create the execution form.</p>
              </div>
            )}

            {fields.map((field, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 space-y-3"
              >
                <div className="flex items-start gap-3">
                  {/* Field name */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={field.name}
                      onChange={e => updateField(idx, { name: e.target.value })}
                      placeholder="field_name"
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50 transition-colors font-mono"
                    />
                  </div>

                  {/* Type selector */}
                  <select
                    value={field.type}
                    onChange={e => updateField(idx, { type: e.target.value as any })}
                    className={`px-3 py-2 rounded-lg border text-xs font-bold cursor-pointer ${typeColors[field.type]}`}
                  >
                    <option value="string">STRING</option>
                    <option value="number">NUMBER</option>
                    <option value="boolean">BOOLEAN</option>
                  </select>

                  {/* Required toggle */}
                  <button
                    onClick={() => updateField(idx, { required: !field.required })}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                      field.required 
                        ? 'text-red-400 bg-red-400/10 border-red-400/20' 
                        : 'text-slate-500 bg-slate-800/50 border-slate-700'
                    }`}
                  >
                    {field.required ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    {field.required ? 'REQ' : 'OPT'}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => removeField(idx)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-slate-600 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Allowed values (for string type) */}
                {field.type === 'string' && (
                  <div className="pl-2 border-l-2 border-slate-800 ml-2">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Allowed Values (optional — creates dropdown)</p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(field.allowed_values || []).map((val, vIdx) => (
                        <span key={vIdx} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold border border-cyan-500/20">
                          <Tag size={8} /> {val}
                          <X size={8} className="cursor-pointer hover:text-red-400 transition-colors" onClick={() => removeAllowedValue(idx, vIdx)} />
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newAllowedValue[idx] || ''}
                        onChange={e => setNewAllowedValue({ ...newAllowedValue, [idx]: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && addAllowedValue(idx)}
                        placeholder="Add value..."
                        className="flex-1 bg-slate-950/50 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-cyan-500/50 transition-colors"
                      />
                      <button onClick={() => addAllowedValue(idx)} className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors">
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-700/50 flex items-center justify-between">
            <button
              onClick={addField}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all text-xs font-bold"
            >
              <Plus size={14} /> Add Field
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">{fields.length} field{fields.length !== 1 ? 's' : ''}</span>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary flex items-center gap-2 text-xs py-2 disabled:opacity-50"
              >
                <Save size={14} /> {isSaving ? 'Saving...' : 'Save Schema'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InputSchemaEditor;
