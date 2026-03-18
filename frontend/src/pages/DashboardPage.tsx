import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ApiResponse } from '../types';
import { DashboardStats, ExecutionSummary } from '../types';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  Workflow,
  MousePointer2
} from 'lucide-react';
import { motion } from 'framer-motion';

const StatCard: React.FC<{ 
  title: string; 
  value: string | number; 
  icon: any; 
  iconBgClass: string;
  iconTextClass: string;
  trend?: string;
  trendColor?: string;
}> = ({ title, value, icon: Icon, iconBgClass, iconTextClass, trend, trendColor = 'emerald' }) => (
  <motion.div 
    whileHover={{ y: -2 }}
    className="bg-[#0e0e0e] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all duration-150 cursor-pointer flex flex-col justify-between"
  >
    <div className="flex items-start justify-between">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBgClass} ${iconTextClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      {trend && (
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-${trendColor}-500/10 text-${trendColor}-400 border border-${trendColor}-500/20`}>
          {trend}
        </span>
      )}
    </div>
    <div className="mt-4">
      <p className="text-3xl font-bold text-[#fafafa] tracking-tight mt-3">{value}</p>
      <p className="text-[#525252] text-xs uppercase tracking-wider mt-1">{title}</p>
    </div>
  </motion.div>
);

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
      return response.data.data;
    },
  });

  // We'll use the recentExecutions from the statsData instead of a separate query
  const recentExecutions = statsData?.recentExecutions || [];
  const executionsLoading = false; // Handled by statsLoading

  const chartData = [
    { name: 'Mon', success: 40, failed: 5 },
    { name: 'Tue', success: 30, failed: 2 },
    { name: 'Wed', success: 60, failed: 8 },
    { name: 'Thu', success: 45, failed: 3 },
    { name: 'Fri', success: 90, failed: 2 },
    { name: 'Sat', success: 20, failed: 1 },
    { name: 'Sun', success: 15, failed: 0 },
  ];

  if (statsLoading || executionsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Activity className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  const stats = statsData || {
    totalWorkflows: 0,
    activeWorkflows: 0,
    totalExecutions: 0,
    successRate: 0,
    pendingApprovals: 0,
  };

  return (
    <div className="space-y-8 pt-4 pb-12 px-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#fafafa] tracking-tight leading-normal py-1">System Overview</h1>
          <p className="text-[#a1a1a1] text-sm mt-1">Real-time performance metrics for your workflows.</p>
        </div>
        <button 
          onClick={() => navigate('/workflows')}
          className="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-semibold px-4 py-2 rounded-lg transition-all duration-150 flex items-center gap-2 text-sm"
        >
          <Workflow className="w-4 h-4" /> New Workflow
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Workflows" 
          value={stats.totalWorkflows} 
          icon={Workflow} 
          iconBgClass="bg-violet-500/15"
          iconTextClass="text-violet-400"
          trend="+12%"
        />
        <StatCard 
          title="Active Executions" 
          value={stats.totalExecutions} 
          icon={Activity} 
          iconBgClass="bg-amber-500/15"
          iconTextClass="text-amber-400"
        />
        <StatCard 
          title="Success Rate" 
          value={`${stats.successRate}%`} 
          icon={CheckCircle2} 
          iconBgClass="bg-emerald-500/15"
          iconTextClass="text-emerald-400"
          trend="+2.4%"
        />
        <StatCard 
          title="Pending Approvals" 
          value={stats.pendingApprovals} 
          icon={MousePointer2} 
          iconBgClass="bg-amber-500/15"
          iconTextClass="text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[#fafafa] text-sm font-semibold tracking-tight">Execution Trends</h2>
            <div className="flex items-center gap-4 text-[10px] font-medium uppercase tracking-wider text-[#a1a1a1]">
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" /> SUCCESS
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="w-2 h-2 bg-red-500 rounded-full" /> FAILED
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#525252" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#525252" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${val}`}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#141414', 
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: '8px',
                    color: '#fafafa',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#a1a1a1' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="success" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorSuccess)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="failed" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Executions */}
        <div className="bg-[#0e0e0e] border border-white/[0.06] rounded-xl flex flex-col h-full overflow-hidden">
          <div className="p-5 border-b border-white/[0.04]">
            <h2 className="text-[#fafafa] text-sm font-semibold tracking-tight">Recent Activity</h2>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {recentExecutions.length > 0 ? (
              recentExecutions.map((execution: any) => (
                <div key={execution.id} className="border-b border-white/[0.04] px-5 py-3 hover:bg-white/[0.02] transition-all duration-100 cursor-pointer flex items-start gap-3">
                  <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    execution.status === 'COMPLETED' ? 'bg-emerald-500' :
                    execution.status === 'FAILED' ? 'bg-red-500' :
                    'bg-amber-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[#fafafa] text-sm font-medium truncate">{execution.workflowName}</p>
                    <p className="text-[#525252] text-xs mt-0.5 truncate">Triggered by {execution.triggeredByName}</p>
                  </div>
                  <span className="text-[10px] text-[#3a3a3a] font-mono whitespace-nowrap mt-0.5">
                    {new Date(execution.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 text-[#3a3a3a] mx-auto mb-3" />
                <p className="text-[#525252] text-xs uppercase tracking-wider">No recent activity</p>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-white/[0.04] bg-[#080808]/50">
            <button className="w-full text-xs text-[#a1a1a1] hover:text-[#fafafa] font-medium transition-colors">
              View All Activity →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

