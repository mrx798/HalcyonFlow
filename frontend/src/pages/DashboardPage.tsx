import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ApiResponse } from '../types/auth';
import { DashboardStats, ExecutionSummary } from '../types/dashboard';
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
  color: string;
  trend?: string;
}> = ({ title, value, icon: Icon, color, trend }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass-card p-6 flex flex-col gap-4"
  >
    <div className="flex items-center justify-between">
      <div className={`p-3 rounded-xl bg-${color}-500/10 border border-${color}-500/20`}>
        <Icon className={`w-6 h-6 text-${color}-500`} />
      </div>
      {trend && (
        <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full flex items-center gap-1">
          <ArrowUpRight className="w-3 h-3" /> {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-sm text-slate-400 font-medium">{title}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
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
        <Activity className="w-8 h-8 text-cyan-500 animate-spin" />
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">System Overview</h1>
          <p className="text-slate-400 mt-1">Real-time performance metrics for your workflows.</p>
        </div>
        <button 
          onClick={() => navigate('/workflows')}
          className="btn-primary flex items-center gap-2"
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
          color="cyan" 
          trend="+12%"
        />
        <StatCard 
          title="Active Executions" 
          value={stats.totalExecutions} 
          icon={Activity} 
          color="purple" 
        />
        <StatCard 
          title="Success Rate" 
          value={`${stats.successRate}%`} 
          icon={CheckCircle2} 
          color="emerald" 
          trend="+2.4%"
        />
        <StatCard 
          title="Pending Approvals" 
          value={stats.pendingApprovals} 
          icon={MousePointer2} 
          color="amber" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white">Execution Trends</h2>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" /> Success
              </div>
              <div className="flex items-center gap-1.5 text-red-400">
                <div className="w-3 h-3 bg-red-500 rounded-full" /> Failed
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#f1f5f9'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="success" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSuccess)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="failed" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Executions */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
          <div className="space-y-6">
            {recentExecutions.length > 0 ? (
              recentExecutions.map((execution: any) => (
                <div key={execution.id} className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    execution.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' :
                    execution.status === 'FAILED' ? 'bg-red-500/10 text-red-500' :
                    'bg-cyan-500/10 text-cyan-500'
                  }`}>
                    {execution.status === 'COMPLETED' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">{execution.workflowName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Triggered by {execution.triggeredByName}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">
                    {new Date(execution.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 text-sm">No recent activity found.</p>
              </div>
            )}
          </div>
          <button className="w-full mt-8 py-2 text-sm text-cyan-500 font-medium hover:underline">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
