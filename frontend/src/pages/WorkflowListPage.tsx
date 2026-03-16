import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowApi } from '../api/workflow.api';
import { ApiResponse } from '../types/auth';
import { Workflow } from '../types/workflow';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Play, 
  Edit3, 
  Calendar,
  Layers,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const StatusBadge: React.FC<{ status: Workflow['status']; active: boolean }> = ({ status, active }) => {
  const colors = {
    DRAFT: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    ACTIVE: active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    ARCHIVED: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${colors[status]}`}>
      {status === 'ACTIVE' && !active ? 'PAUSED' : status}
    </span>
  );
};

const WorkflowListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDesc, setNewWorkflowDesc] = useState('');
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: workflows, isLoading, refetch } = useQuery<Workflow[]>({
    queryKey: ['workflows'],
    queryFn: async () => {
      const response = await workflowApi.getWorkflows();
      return response.data.data;
    },
  });

  const createMutation = useMutation<Workflow, any, void>({
    mutationFn: async () => {
      const payload = {
        name: newWorkflowName,
        description: newWorkflowDesc,
        inputSchema: {}
      };
      const res = await workflowApi.createWorkflow(payload);
      return res.data.data;
    },
    onSuccess: (data) => {
      toast.success('Workflow created!');
      setIsModalOpen(false);
      navigate(`/workflows/${data.id}`); 
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create workflow');
    }
  });

  const handleToggle = async (id: string, current: boolean) => {
    // We would use an API call here, for now refetch is safe fallback
    toast.success(`Workflow toggle action triggered`);
    refetch();
  };

  const filtered = (workflows || []).filter((w: Workflow) => 
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    (w.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Your Workflows</h1>
          <p className="text-slate-400 mt-1">Manage and monitor your automation processes.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2 h-fit">
          <Plus className="w-5 h-5" /> New workflow
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-card w-full max-w-md p-6 relative">
            <h2 className="text-xl font-bold text-white mb-4">Create New Workflow</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Name</label>
                <input 
                  type="text" 
                  className="w-full input-field mt-1" 
                  value={newWorkflowName}
                  onChange={e => setNewWorkflowName(e.target.value)}
                  placeholder="e.g. Expense Approval"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400">Description</label>
                <textarea 
                  className="w-full input-field mt-1" 
                  value={newWorkflowDesc}
                  onChange={e => setNewWorkflowDesc(e.target.value)}
                  placeholder="What does this workflow do?"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => createMutation.mutate()}
                  className="btn-primary !bg-cyan-600 hover:!bg-cyan-500"
                  disabled={createMutation.isPending || !newWorkflowName}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Workflow'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 py-2 border-b border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none pl-10 pr-4 py-2 focus:ring-0 outline-none text-sm text-white placeholder-slate-600"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-700 transition-colors text-xs font-medium text-slate-300">
          <Filter className="w-3 h-3" /> Filter
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnimatePresence>
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="glass-card p-6 h-48 animate-pulse bg-slate-800/30" />
            ))
          ) : filtered.map((workflow, index) => (
            <motion.div
              key={workflow.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card group hover:border-cyan-500/40 transition-all duration-500 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 group-hover:scale-110 transition-transform">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">
                        {workflow.name}
                      </h3>
                      <p className="text-slate-400 text-sm mt-0.5 line-clamp-1">{workflow.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={workflow.status} active={workflow.isActive} />
                    <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-500">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-4 border-t border-slate-700/50 pt-6">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Layers className="w-3.5 h-3.5" />
                    {workflow.stepCount || 0} Steps
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    v{workflow.version}
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <button 
                      onClick={() => handleToggle(workflow.id, workflow.isActive)}
                      className={`p-2 rounded-lg transition-all ${
                        workflow.isActive 
                          ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' 
                          : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                      }`}
                    >
                      <Play className={`w-4 h-4 ${workflow.isActive ? 'fill-amber-500' : 'fill-emerald-500'}`} />
                    </button>
                    <Link 
                      to={`/workflows/${workflow.id}`}
                      className="p-2 rounded-lg bg-cyan-600/10 text-cyan-500 hover:bg-cyan-600/20 transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-20 bg-slate-800/20 rounded-3xl border border-slate-800 border-dashed">
          <Zap className="w-16 h-16 text-slate-700 mx-auto mb-6 opacity-20" />
          <h3 className="text-xl font-bold text-slate-400">No matching workflows</h3>
          <p className="text-slate-500 mt-2">Try adjusting your search or create a new one.</p>
          <button className="mt-8 text-cyan-500 font-medium hover:underline flex items-center justify-center gap-2 mx-auto">
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkflowListPage;
