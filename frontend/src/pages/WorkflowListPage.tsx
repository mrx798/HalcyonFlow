import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowApi } from '../api/workflow.api';
import { ApiResponse } from '../types';
import { Workflow } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Play, 
  Edit3, 
  Calendar,
  Layers,
  Zap,
  ChevronLeft,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const StatusBadge: React.FC<{ status: Workflow['status']; active: boolean }> = ({ status, active }) => {
  const colors = {
    DRAFT: 'bg-white/[0.04] text-[#a1a1a1] border-white/[0.08]',
    ACTIVE: active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    ARCHIVED: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-widest ${colors[status]}`}>
      {status === 'ACTIVE' && !active ? 'PAUSED' : status}
    </span>
  );
};

const WorkflowListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDesc, setNewWorkflowDesc] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: pageData, isLoading, refetch } = useQuery({
    queryKey: ['workflows', page, size, debouncedSearch],
    queryFn: async () => {
      const response = await workflowApi.getWorkflows(page, size, debouncedSearch);
      return response.data.data;
    },
  });

  const workflows = pageData?.content || [];

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

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b border-white/[0.06] pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#fafafa] tracking-tight">Your Workflows</h1>
          <p className="text-[#a1a1a1] font-mono text-sm mt-2">Manage and monitor your automation processes.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2 h-fit text-xs font-bold tracking-widest uppercase">
          <Plus className="w-4 h-4" /> New workflow
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-card w-full max-w-md p-8 relative shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center gap-3 mb-8 border-b border-white/[0.06] pb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Zap className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-[#fafafa] tracking-tight">Create New Workflow</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-[#a1a1a1] uppercase tracking-widest block mb-2 px-1">
                  Workflow Name
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  autoFocus
                  value={newWorkflowName}
                  onChange={e => setNewWorkflowName(e.target.value)}
                  placeholder="e.g. Daily Data Sync"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#a1a1a1] uppercase tracking-widest block mb-2 px-1">
                  Description
                </label>
                <textarea 
                  className="input-field" 
                  value={newWorkflowDesc}
                  onChange={e => setNewWorkflowDesc(e.target.value)}
                  placeholder="What is the purpose of this workflow?"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-4 justify-end mt-10 pt-6 border-t border-white/[0.04]">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => createMutation.mutate()}
                  className="btn-primary min-w-[140px]"
                  disabled={createMutation.isPending || !newWorkflowName}
                >
                  {createMutation.isPending ? 'Initializing...' : 'Create Workflow'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="flex items-center gap-4 py-3 border-b border-white/[0.04] mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#525252]" />
          <input
            type="text"
            placeholder="Search by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none pl-10 pr-4 py-2 focus:ring-0 outline-none text-sm text-[#fafafa] placeholder-[#525252] font-mono"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.10] bg-white/[0.02] hover:bg-white/[0.06] transition-colors text-[10px] font-bold uppercase tracking-widest text-[#fafafa]">
          <Filter className="w-3 h-3" /> Filter
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnimatePresence>
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="glass-card p-6 h-48 animate-pulse bg-white/[0.02]" />
            ))
          ) : workflows.map((workflow: Workflow, index: number) => (
            <motion.div
              key={workflow.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card group hover:border-amber-500/40 transition-all duration-500 overflow-hidden bg-[#0e0e0e] border border-white/[0.06]"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <Link to={`/workflows/${workflow.id}`}>
                        <h3 className="text-lg font-bold text-[#fafafa] group-hover:text-amber-500 transition-colors tracking-tight">
                          {workflow.name}
                        </h3>
                      </Link>
                      <p className="text-[#a1a1a1] text-sm mt-0.5 line-clamp-1">{workflow.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={workflow.status} active={workflow.isActive} />
                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          setOpenMenuId(openMenuId === workflow.id ? null : workflow.id);
                        }}
                        className="p-2 hover:bg-white/[0.08] rounded-lg transition-colors text-[#525252]"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      <AnimatePresence>
                        {openMenuId === workflow.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute right-0 top-full mt-2 w-48 bg-[#141414] border border-white/[0.10] rounded-xl shadow-2xl z-20 overflow-hidden py-1"
                            >
                              <Link 
                                to={`/workflows/${workflow.id}`}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-white/[0.04] text-sm text-[#fafafa] transition-colors"
                              >
                                <Edit3 className="w-4 h-4 text-[#a1a1a1]" /> Edit Workflow
                              </Link>
                              <button 
                                onClick={() => {
                                  handleToggle(workflow.id, workflow.isActive);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-white/[0.04] text-sm text-[#fafafa] transition-colors"
                              >
                                <Play className="w-4 h-4 text-[#a1a1a1]" /> {workflow.isActive ? 'Pause Workflow' : 'Activate Workflow'}
                              </button>
                              <div className="h-px bg-white/[0.04] my-1" />
                              <button 
                                onClick={() => {
                                  toast.error('Delete functionality restricted');
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-red-500/10 text-sm text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" /> Delete Workflow
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/[0.04] pt-6">
                  <div className="flex items-center gap-2 text-xs text-[#a1a1a1] font-mono tracking-wide">
                    <Layers className="w-3.5 h-3.5 text-[#525252]" />
                    {workflow.stepCount || 0} Steps
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#a1a1a1] font-mono tracking-wide">
                    <Calendar className="w-3.5 h-3.5 text-[#525252]" />
                    v{workflow.version}
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <button 
                      onClick={() => handleToggle(workflow.id, workflow.isActive)}
                      className={`p-2 rounded-lg transition-all border ${
                        workflow.isActive 
                          ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20' 
                          : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20'
                      }`}
                    >
                      <Play className={`w-3.5 h-3.5 ${workflow.isActive ? 'fill-amber-500' : 'fill-emerald-500'}`} />
                    </button>
                    <Link 
                      to={`/workflows/${workflow.id}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] text-[#fafafa] hover:bg-white/[0.08] border border-white/[0.10] transition-all text-[10px] font-bold uppercase tracking-widest"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#a1a1a1]" />
                      <span>Edit</span>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination Controls */}
      {pageData && pageData.totalPages > 0 && (
        <div className="flex items-center justify-between border-t border-white/[0.04] pt-8 mt-8">
          <div className="flex items-center gap-4 text-xs tracking-wider text-[#a1a1a1] font-mono">
            <span>
              Showing {pageData.pageable.offset + 1} to {Math.min(pageData.pageable.offset + pageData.size, pageData.totalElements)} of {pageData.totalElements} results
            </span>
            <select 
              value={size} 
              onChange={e => { setSize(Number(e.target.value)); setPage(0); }}
              className="bg-[#141414] border border-white/[0.10] rounded-lg px-2 py-1.5 outline-none focus:border-amber-500 text-[#fafafa] transition-all"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <button 
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-2 rounded-lg border border-white/[0.10] bg-white/[0.02] hover:bg-white/[0.06] disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-[#fafafa]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs tracking-wide text-[#a1a1a1] px-4 font-bold uppercase">
              Page <span className="text-amber-500">{page + 1}</span> / {pageData.totalPages}
            </span>
            <button 
              onClick={() => setPage(Math.min(pageData.totalPages - 1, page + 1))}
              disabled={page >= pageData.totalPages - 1}
              className="p-2 rounded-lg border border-white/[0.10] bg-white/[0.02] hover:bg-white/[0.06] disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-[#fafafa]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {!isLoading && workflows.length === 0 && (
        <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-white/[0.06] border-dashed">
          <Zap className="w-16 h-16 text-[#3a3a3a] mx-auto mb-6" />
          <h3 className="text-xl font-bold text-[#fafafa] tracking-tight">No matching workflows</h3>
          <p className="text-[#a1a1a1] mt-2 text-sm">Try adjusting your search or create a new one.</p>
          <button onClick={() => setSearch('')} className="mt-8 text-amber-500 font-bold uppercase tracking-widest text-[10px] hover:underline flex items-center justify-center gap-2 mx-auto">
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkflowListPage;

