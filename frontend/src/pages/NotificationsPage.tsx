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
      default: return <Bell className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#fafafa] tracking-tight">Notifications</h1>
          <p className="text-[#a1a1a1] mt-1 font-mono text-sm">Stay updated on your workflow events.</p>
        </div>
        <button 
          onClick={() => markAllRead.mutate()}
          className="text-[10px] font-bold tracking-widest uppercase text-amber-500 hover:text-amber-400 p-2 hover:bg-amber-500/10 rounded-lg transition-all"
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
                className={`glass-card p-6 flex gap-6 group transition-all ${!notif.read ? 'border-l-4 border-l-amber-500 border-white/[0.10]' : 'hover:border-white/[0.10]'}`}
              >
                <div className={`p-3 rounded-2xl flex items-center justify-center h-fit ${notif.read ? 'bg-[#080808] text-[#525252]' : 'bg-amber-500/10 text-amber-500'}`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-[#525252] uppercase tracking-widest">
                      {notif.type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-[#525252] font-mono flex items-center gap-1.5">
                      <Clock size={10} /> {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className={`text-sm tracking-wide ${notif.read ? 'text-[#a1a1a1]' : 'text-[#fafafa] font-medium'}`}>
                    {notif.message}
                  </p>
                </div>
                {!notif.read && (
                  <button 
                    onClick={() => markRead.mutate(notif.id)}
                    className="self-center p-2 rounded-xl bg-[#080808] border border-white/[0.04] text-[#a1a1a1] hover:text-emerald-400 hover:border-emerald-500/40 transition-all hover:bg-emerald-500/10"
                  >
                    <Check size={16} />
                  </button>
                )}
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-dashed border-white/[0.06]">
              <Mail className="w-16 h-16 text-[#3a3a3a] mx-auto mb-4" />
              <p className="text-[#a1a1a1] font-medium tracking-wide">You're all caught up!</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NotificationsPage;

