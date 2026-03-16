import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { ApiResponse } from '../types/auth';
import { ExecutionSummary } from '../types/dashboard';
import { 
  History, 
  Search, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Filter,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AuditLogPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: executions, isLoading } = useQuery({
    queryKey: ['all-executions'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>('/executions');
      return response.data.data.content || [];
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'FAILED': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'PAUSED': return <Clock className="w-4 h-4 text-amber-500" />;
      default: return <Activity className="w-4 h-4 text-cyan-500" />;
    }
  };

  const filtered = (executions || []).filter((ex: any) => 
    ex.workflowName.toLowerCase().includes(search.toLowerCase()) ||
    ex.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <History className="text-cyan-500" /> Audit Logs
        </h1>
        <p className="text-slate-400 mt-1">Full history of all workflow executions and system events.</p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by workflow or execution ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-cyan-500/30 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all text-xs font-bold">
              <Calendar size={14} /> Last 30 Days
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all text-xs font-bold">
              <Filter size={14} /> More Filters
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 text-[10px] uppercase tracking-widest text-slate-500 font-bold border-b border-slate-700/30">
                <th className="px-8 py-4">Workflow</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Triggered By</th>
                <th className="px-8 py-4">Duration</th>
                <th className="px-8 py-4">Timeline</th>
                <th className="px-8 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30 text-sm">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-8 py-6 h-16 bg-slate-800/20" />
                  </tr>
                ))
              ) : filtered.map((ex: any) => (
                <tr key={ex.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">{ex.workflowName}</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">{ex.id}</p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(ex.status)}
                      <span className="text-xs font-medium text-slate-300 capitalize">{ex.status.toLowerCase()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-slate-400 text-xs">
                    {ex.triggeredBy || 'System'}
                  </td>
                  <td className="px-8 py-5 text-slate-400 text-xs">
                    {ex.duration ? `${ex.duration}ms` : '--'}
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-xs text-slate-300">{new Date(ex.startedAt).toLocaleDateString()}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{new Date(ex.startedAt).toLocaleTimeString()}</p>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <Link 
                      to={`/executions/${ex.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-500 hover:text-cyan-400 transition-colors"
                    >
                      DETAILS <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isLoading && filtered.length === 0 && (
          <div className="py-20 text-center">
            <AlertCircle className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-30" />
            <p className="text-slate-500">No execution records found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogPage;
