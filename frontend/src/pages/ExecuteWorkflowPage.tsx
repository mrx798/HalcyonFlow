import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { executionApi } from '../api/execution.api';
import { ApiResponse } from '../types/auth';
import { Workflow } from '../types/workflow';
import { Play, ChevronLeft, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const ExecuteWorkflowPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isExecuting, setIsExecuting] = useState(false);

  const { data: workflow, isLoading } = useQuery<Workflow & { inputSchema?: Record<string, any> }>({
    queryKey: ['workflow', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>(`/workflows/${id}`);
      return response.data.data;
    },
  });

  const schemaEntries = Object.entries(workflow?.inputSchema || {});

  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields
    for (const [key, schema] of schemaEntries) {
      const s = schema as any;
      if (s.required && !formData[key] && formData[key] !== 0) {
        toast.error(`"${key}" is required`);
        return;
      }
    }

    setIsExecuting(true);
    try {
      const res = await executionApi.startExecution(id!, { inputData: formData });
      toast.success('Execution started!');
      const execId = res.data?.data?.id || res.data?.data?.executionId;
      if (execId) {
        navigate(`/executions/${execId}`);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to start execution');
    } finally {
      setIsExecuting(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-full text-slate-400">Loading workflow...</div>;

  const renderField = (key: string, schema: any) => {
    const value = formData[key] ?? '';

    if (schema.allowed_values && Array.isArray(schema.allowed_values)) {
      return (
        <select
          value={value}
          onChange={e => handleFieldChange(key, e.target.value)}
          className="w-full input-field text-sm"
        >
          <option value="">Select {key}...</option>
          {schema.allowed_values.map((v: string) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      );
    }

    if (schema.type === 'number') {
      return (
        <input
          type="number"
          value={value}
          onChange={e => handleFieldChange(key, parseFloat(e.target.value) || 0)}
          placeholder={`Enter ${key}`}
          className="w-full input-field text-sm"
        />
      );
    }

    if (schema.type === 'boolean') {
      return (
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={!!value}
            onChange={e => handleFieldChange(key, e.target.checked)}
          />
          <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
          <span className="ml-3 text-sm text-slate-300">{value ? 'Yes' : 'No'}</span>
        </label>
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={e => handleFieldChange(key, e.target.value)}
        placeholder={`Enter ${key}`}
        className="w-full input-field text-sm"
      />
    );
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors text-sm">
          <ChevronLeft size={16} /> Back to Workflow
        </button>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Execute Workflow</h1>
            <p className="text-slate-400 mt-0.5">{workflow?.name}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Panel */}
        <div className="lg:col-span-2">
          <form onSubmit={handleExecute} className="glass-card p-8 space-y-6">
            {schemaEntries.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400">This workflow has no input parameters.</p>
                <p className="text-slate-500 text-sm mt-1">It will execute with an empty context.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Input Parameters</h2>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{schemaEntries.length} Fields</span>
                </div>
                <div className="space-y-6">
                  {schemaEntries.map(([key, schema]: [string, any]) => {
                    const error = schema.required && !formData[key] && formData[key] !== 0 && formData[key] !== false;
                    return (
                      <div key={key} className="space-y-2">
                        <label className="text-sm text-slate-300 font-medium flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {key}
                            {schema.required && <span className="text-red-400 text-xs" title="Required">*</span>}
                          </div>
                          <span className="text-[10px] text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-lg border border-slate-700/50 uppercase tracking-wider">{schema.type || 'string'}</span>
                        </label>
                        <div className={error && Object.keys(formData).includes(key) ? "ring-1 ring-red-500/50 rounded-lg" : ""}>
                          {renderField(key, schema)}
                        </div>
                        {error && Object.keys(formData).includes(key) && (
                          <p className="text-[10px] text-red-400 mt-1">This field is required.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className="pt-6 border-t border-slate-700/50 mt-8">
              <button
                type="submit"
                disabled={isExecuting}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isExecuting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    Starting Execution...
                  </>
                ) : (
                  <>
                    <Play size={16} className="fill-white group-hover:scale-110 transition-transform" />
                    Start Execution
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Payload Preview */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass flex flex-col h-full border border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="bg-slate-900/80 p-4 border-b border-slate-700/50 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
              </div>
              <span className="text-xs font-mono text-slate-400 ml-2">Live Payload Preview</span>
            </div>
            <div className="flex-1 p-4 bg-slate-950/50 font-mono text-xs overflow-auto">
              <pre className="text-emerald-400/80">
                {JSON.stringify({
                  workflowId: id,
                  inputData: formData
                }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecuteWorkflowPage;
