import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { ApiResponse } from '../types/auth';
import { Bell, Check, CheckCircle2, Clock, Mail, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Notification {
  id: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'APPROVAL_REQUEST';
  read: boolean;
  createdAt: string;
}

const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Notification[]>>('/notifications');
      return response.data.data;
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => api.post('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All marked as read');
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'APPROVAL_REQUEST': return <UserCheck className="w-5 h-5 text-amber-500" />;
      case 'SUCCESS': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      default: return <Bell className="w-5 h-5 text-cyan-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400 mt-1">Stay updated on your workflow events.</p>
        </div>
        <button 
          onClick={() => markAllRead.mutate()}
          className="text-xs font-bold text-cyan-500 hover:text-cyan-400 p-2 hover:bg-cyan-500/10 rounded-lg transition-all"
        >
          MARK ALL AS READ
        </button>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="glass-card p-6 h-24 animate-pulse" />
            ))
          ) : (notifications || []).length > 0 ? (
            notifications?.map((notif, index) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className={`glass-card p-6 flex gap-6 group hover:border-slate-600 transition-all ${!notif.read ? 'border-l-4 border-l-cyan-500' : ''}`}
              >
                <div className={`p-3 rounded-2xl ${notif.read ? 'bg-slate-800 text-slate-500' : 'bg-slate-800 text-cyan-500 animate-pulse'}`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {notif.type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-600 font-medium flex items-center gap-1.5">
                      <Clock size={10} /> {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className={`text-sm ${notif.read ? 'text-slate-400' : 'text-slate-200 font-medium'}`}>
                    {notif.message}
                  </p>
                </div>
                {!notif.read && (
                  <button 
                    onClick={() => markRead.mutate(notif.id)}
                    className="self-center p-2 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
                  >
                    <Check size={16} />
                  </button>
                )}
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-slate-800/10 rounded-3xl border border-dashed border-slate-800">
              <Mail className="w-16 h-16 text-slate-800 mx-auto mb-4" />
              <p className="text-slate-600">You're all caught up!</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NotificationsPage;
