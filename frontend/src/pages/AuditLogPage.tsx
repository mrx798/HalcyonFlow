import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { Filter, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

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

  const handleExportCSV = () => {
    if (!logs || logs.length === 0) {
      toast.error('No logs to export');
      return;
    }
    const headers = ['Execution ID', 'Workflow Name', 'Status', 'Started At', 'Ended At', 'Duration (s)'];
    const csvContent = [
      headers.join(','),
      ...logs.map((log: any) => {
        const durationStr = formatDuration(log.startedAt, log.endedAt).replace('s', '');
        return [
          log.id,
          `"${log.workflowName || ''}"`,
          log.status,
          log.startedAt ? new Date(log.startedAt).toISOString() : '',
          log.endedAt ? new Date(log.endedAt).toISOString() : '',
          durationStr
        ].join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Exported Successfully');
  };

  return (
    <div className="w-full h-full relative font-sans text-sm pb-12">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        
        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b border-white/[0.06] pb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#fafafa] tracking-tight flex items-center gap-3">
              <span className="text-amber-500">❖</span> Audit Logs
            </h1>
            <p className="text-[#a1a1a1] font-mono text-sm mt-2">Comprehensive history of all workflow executions and state changes.</p>
          </div>
          
          <div className="flex gap-4 font-mono text-sm">
             <div className="bg-[#141414] border border-white/[0.08] rounded-xl p-4 min-w-[120px] shadow-lg inset-shadow">
                <div className="text-[#525252] text-[10px] uppercase tracking-widest font-bold mb-1.5">Total Executions</div>
                <div className="text-[#fafafa] text-2xl font-bold">{totalLogs}</div>
             </div>
             <div className="bg-[#141414] border border-white/[0.08] rounded-xl p-4 min-w-[120px] shadow-lg inset-shadow">
                <div className="text-[#525252] text-[10px] uppercase tracking-widest font-bold mb-1.5">Success Rate</div>
                <div className="text-emerald-400 text-2xl font-bold">{successRate}%</div>
             </div>
             <div className="bg-[#141414] border border-white/[0.08] rounded-xl p-4 min-w-[120px] shadow-lg inset-shadow">
                <div className="text-[#525252] text-[10px] uppercase tracking-widest font-bold mb-1.5">Avg Duration</div>
                <div className="text-[#fafafa] text-2xl font-bold">{avgDurationStr}</div>
             </div>
             <div className="bg-[#141414] border border-white/[0.08] rounded-xl p-4 min-w-[120px] shadow-lg inset-shadow">
                <div className="text-[#525252] text-[10px] uppercase tracking-widest font-bold mb-1.5">Failed</div>
                <div className="text-red-400 text-2xl font-bold">{failedLogs}</div>
             </div>
             <button 
               onClick={handleExportCSV}
               className="flex items-center gap-2 border border-white/[0.10] bg-white/[0.02] hover:bg-white/[0.06] text-[#fafafa] px-5 py-2.5 rounded-xl transition-all ml-4 self-center h-fit text-xs font-semibold tracking-wide shadow-lg cursor-pointer active:scale-95"
             >
               <Download size={14} className="text-[#a1a1a1]" />
               Export CSV
             </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="border border-white/[0.06] bg-[#0e0e0e] rounded-xl p-4 flex flex-wrap gap-4 font-mono text-xs items-center shadow-lg">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[#525252]" />
            <span className="text-[#a1a1a1] uppercase tracking-widest font-bold">Filters</span>
          </div>
          
          <span className="text-[#3a3a3a]">|</span>

          <input 
            type="text" 
            placeholder="Search executions..." 
            value={filters.workflowId || ''}
            onChange={e => setFilters({...filters, workflowId: e.target.value})}
            className="bg-[#141414] border border-white/[0.10] rounded-lg px-3 py-2 text-[#fafafa] outline-none focus:border-amber-500/50 min-w-[200px] transition-all"
          />

          <select 
            value={filters.status || ''} 
            onChange={e => setFilters({...filters, status: e.target.value})}
            className="bg-[#141414] border border-white/[0.10] rounded-lg px-3 py-2 text-[#fafafa] outline-none focus:border-amber-500/50 transition-all"
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
            className="bg-[#141414] border border-white/[0.10] rounded-lg px-3 py-2 text-[#a1a1a1] outline-none focus:border-amber-500/50 [color-scheme:dark] transition-all"
          />

          <input 
            type="date" 
            value={filters.endDate || ''}
            onChange={e => setFilters({...filters, endDate: e.target.value})}
            className="bg-[#141414] border border-white/[0.10] rounded-lg px-3 py-2 text-[#a1a1a1] outline-none focus:border-amber-500/50 [color-scheme:dark] transition-all"
          />

          <div className="flex-1"></div>
          
          <button 
            onClick={() => setFilters({})}
            className="text-[#525252] hover:text-[#fafafa] transition-colors"
          >
            Clear Filters
          </button>
        </div>

        {/* Table */}
        <div className="border border-white/[0.06] bg-[#0e0e0e] rounded-xl overflow-hidden shadow-2xl font-mono text-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#080808] border-b border-white/[0.04] text-[#a1a1a1] uppercase tracking-widest text-[10px]">
                <th className="p-4 font-bold border-r border-white/[0.02]">Execution ID</th>
                <th className="p-4 font-bold border-r border-white/[0.02]">Workflow</th>
                <th className="p-4 font-bold border-r border-white/[0.02]">Status</th>
                <th className="p-4 font-bold border-r border-white/[0.02]">Started</th>
                <th className="p-4 font-bold border-r border-white/[0.02]">Duration</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#525252] animate-pulse uppercase tracking-widest text-xs">Loading audit logs...</td>
                </tr>
              ) : logs?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#525252]">No executions found matching your criteria.</td>
                </tr>
              ) : (
                logs?.map((log: any) => {
                  const shortId = log.id ? log.id.substring(0,8) : 'unknown';
                  
                  return (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4 border-r border-white/[0.02]">
                        <div className="flex items-center gap-2">
                           <span className="text-[#fafafa] font-bold">{shortId}</span>
                           <button 
                             onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(log.id); }}
                             className="text-[#525252] hover:text-[#fafafa] opacity-0 group-hover:opacity-100 transition-all"
                             title="Copy full ID"
                           >
                             <Copy size={12} />
                           </button>
                        </div>
                      </td>
                      <td className="p-4 text-[#fafafa] font-bold border-r border-white/[0.02]">{log.workflowName}</td>
                      <td className="p-4 border-r border-white/[0.02]">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider border
                          ${log.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                            log.status === 'FAILED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                            log.status === 'IN_PROGRESS' || log.status === 'PAUSED' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                            'bg-white/[0.04] text-[#a1a1a1] border-white/[0.08]'}
                        `}>
                          {log.status === 'COMPLETED' ? '✓ ' : log.status === 'FAILED' ? '✗ ' : log.status === 'PAUSED' ? '● ' : ''}
                          {log.status}
                        </span>
                      </td>
                      <td className="p-4 text-[#a1a1a1] border-r border-white/[0.02]">{new Date(log.startedAt).toLocaleString()}</td>
                      <td className="p-4 text-[#a1a1a1] border-r border-white/[0.02]">{formatDuration(log.startedAt, log.endedAt)}</td>
                      <td className="p-4 text-right">
                         <Link 
                           to={`/executions/${log.id}`} 
                           className="text-amber-400 hover:text-amber-300 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-amber-500/30 px-3 py-1.5 rounded-lg inline-block"
                         >
                           [ View ]
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

