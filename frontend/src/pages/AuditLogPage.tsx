import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { Filter, Copy } from 'lucide-react';

interface AuditFilter {
  status?: string;
  workflowId?: string;
  startDate?: string;
  endDate?: string;
}

const AuditLogPage: React.FC = () => {
  const [filters, setFilters] = useState<AuditFilter>({});
  
  const { data: qData, isLoading } = useQuery({
    queryKey: ['auditLogs', filters],
    queryFn: async () => {
      const resp = await api.get('/executions', { params: { ...filters, limit: 100 } });
      return resp.data.data.content || [];
    }
  });

  const rawLogs = qData || [];
  
  // Client-side Filtering Logic
  const filteredLogs = rawLogs.filter((log: any) => {
    // 1. Workflow Name / ID Search
    if (filters.workflowId) {
      const search = filters.workflowId.toLowerCase();
      const nameMatch = log.workflowName?.toLowerCase().includes(search);
      const idMatch   = log.id?.toLowerCase().includes(search);
      if (!nameMatch && !idMatch) return false;
    }

    // 2. Status Filter
    if (filters.status && log.status !== filters.status) {
      return false;
    }

    // 3. Date Range Filter
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      start.setHours(0,0,0,0);
      if (new Date(log.startedAt) < start) return false;
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23,59,59,999);
      if (new Date(log.startedAt) > end) return false;
    }

    return true;
  });

  const logs = filteredLogs;
  
  // Calculate Stats based on filtered logs
  const totalLogs = logs.length;
  const completedLogs = logs.filter((l:any) => l.status === 'COMPLETED').length;
  const failedLogs = logs.filter((l:any) => l.status === 'FAILED').length;
  const successRate = totalLogs ? Math.round((completedLogs / totalLogs) * 100) : 0;
  
  const completedWithDuration = logs.filter((l:any) => l.status === 'COMPLETED' && l.startedAt && l.endedAt);
  const avgDurationMs = (completedWithDuration.reduce((acc:number, l:any) => acc + (new Date(l.endedAt).getTime() - new Date(l.startedAt).getTime()), 0) / (completedWithDuration.length || 1));
  const avgDurationStr = avgDurationMs > 0 ? `${(avgDurationMs / 1000).toFixed(1)}s` : '0s';

  const formatDuration = (start: string, end: string) => {
    if (!start || !end) return '-';
    return `${((new Date(end).getTime() - new Date(start).getTime()) / 1000).toFixed(1)}s`;
  };

  return (
    <div className="bg-[#0B0F19]">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        
        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-black text-white tracking-widest uppercase flex items-center gap-3">
              <span className="text-indigo-500">❖</span> Audit Logs
            </h1>
            <p className="text-slate-500 font-mono text-sm mt-2">Comprehensive history of all workflow executions and state changes.</p>
          </div>
          
          <div className="flex gap-4 font-mono text-sm">
             <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 min-w-[120px]">
                <div className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1">Total Executions</div>
                <div className="text-white text-xl font-black">{totalLogs}</div>
             </div>
             <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 min-w-[120px]">
                <div className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1">Success Rate</div>
                <div className="text-emerald-400 text-xl font-black">{successRate}%</div>
             </div>
             <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 min-w-[120px]">
                <div className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1">Avg Duration</div>
                <div className="text-white text-xl font-black">{avgDurationStr}</div>
             </div>
             <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 min-w-[120px]">
                <div className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1">Failed</div>
                <div className="text-red-400 text-xl font-black">{failedLogs}</div>
             </div>
             <button className="flex items-center gap-2 border border-slate-700 bg-slate-800/50 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors ml-4 self-center h-fit text-xs font-bold tracking-widest uppercase">
               Export CSV
             </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="border border-slate-800 bg-slate-900/50 rounded-xl p-4 flex flex-wrap gap-4 font-mono text-xs items-center shadow-lg">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-500" />
            <span className="text-slate-400 uppercase tracking-widest font-bold">Filters</span>
          </div>
          
          <span className="text-slate-700">|</span>

          <input 
            type="text" 
            placeholder="Search executions..." 
            value={filters.workflowId || ''}
            onChange={e => setFilters({...filters, workflowId: e.target.value})}
            className="bg-[#0f172a] border border-slate-700 rounded px-3 py-1.5 text-white outline-none focus:border-indigo-500 min-w-[200px]"
          />

          <select 
            value={filters.status || ''} 
            onChange={e => setFilters({...filters, status: e.target.value})}
            className="bg-[#0f172a] border border-slate-700 rounded px-3 py-1.5 text-white outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="FAILED">FAILED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="PAUSED">PAUSED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <input 
            type="date" 
            value={filters.startDate || ''}
            onChange={e => setFilters({...filters, startDate: e.target.value})}
            className="bg-[#0f172a] border border-slate-700 rounded px-3 py-1.5 text-slate-300 outline-none focus:border-indigo-500 [color-scheme:dark]"
          />

          <input 
            type="date" 
            value={filters.endDate || ''}
            onChange={e => setFilters({...filters, endDate: e.target.value})}
            className="bg-[#0f172a] border border-slate-700 rounded px-3 py-1.5 text-slate-300 outline-none focus:border-indigo-500 [color-scheme:dark]"
          />

          <div className="flex-1"></div>
          
          <button 
            onClick={() => setFilters({})}
            className="text-slate-500 hover:text-white transition-colors"
          >
            Clear Filters
          </button>
        </div>

        {/* Table */}
        <div className="border border-slate-800 bg-[#0B0F19] rounded-xl overflow-hidden shadow-2xl font-mono text-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-widest text-[10px]">
                <th className="p-4 font-bold">Execution ID</th>
                <th className="p-4 font-bold">Workflow</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Started</th>
                <th className="p-4 font-bold">Duration</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 animate-pulse">Loading audit logs...</td>
                </tr>
              ) : logs?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">No executions found matching your criteria.</td>
                </tr>
              ) : (
                logs?.map((log: any) => {
                  const shortId = log.id ? log.id.substring(0,8) : 'unknown';
                  
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                           <span className="text-slate-300 font-bold">{shortId}</span>
                           <button 
                             onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(log.id); }}
                             className="text-slate-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                             title="Copy full ID"
                           >
                             <Copy size={12} />
                           </button>
                        </div>
                      </td>
                      <td className="p-4 text-white font-bold">{log.workflowName}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider border
                          ${log.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                            log.status === 'FAILED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                            log.status === 'IN_PROGRESS' || log.status === 'PAUSED' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                            'bg-slate-500/10 text-slate-400 border-slate-500/20'}
                        `}>
                          {log.status === 'COMPLETED' ? '✅ ' : log.status === 'FAILED' ? '❌ ' : log.status === 'PAUSED' ? '⏳ ' : ''}
                          {log.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">{new Date(log.startedAt).toLocaleString()}</td>
                      <td className="p-4 text-slate-400">{formatDuration(log.startedAt, log.endedAt)}</td>
                      <td className="p-4 text-right">
                         <Link 
                           to={`/executions/${log.id}`} 
                           className="text-indigo-400 hover:text-indigo-300 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-indigo-500/30 px-3 py-1.5 rounded"
                         >
                           [ View Logs ]
                         </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogPage;
