import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Bell, User, Settings, Check, Clock, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../../api/notification.api';

const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = React.useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const res = await notificationApi.getNotifications();
        return res.data.data || [];
      } catch {
        // Silent fail — don't crash the app if backend is down
        console.warn('Notifications unavailable');
        return [];
      }
    },
    refetchInterval: 30000,
    retry: false,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await notificationApi.markAsRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await notificationApi.markAllAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;

  return (
    <header className="h-20 glass-card !rounded-none !border-t-0 !border-x-0 border-b border-slate-700/50 flex items-center justify-between px-8 sticky top-0 z-50">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search workflows, executions..."
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 focus:ring-2 focus:ring-cyan-500/30 transition-all outline-none text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <Bell className="w-5 h-5 text-slate-400" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-cyan-500 rounded-full border-2 border-slate-800" />
            )}
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 glass-card p-0 z-[60] overflow-hidden flex flex-col max-h-96"
              >
                <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/50">
                  <h3 className="text-sm font-bold text-slate-200">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => markAllReadMutation.mutate()}
                      className="text-[10px] text-cyan-500 hover:text-cyan-400 font-bold uppercase tracking-wider"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {!notifications?.length ? (
                    <div className="p-6 text-center text-slate-500 text-xs">
                       No notifications yet
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/50">
                      {notifications.map((n: any) => (
                        <div 
                          key={n.id} 
                          className={`p-4 hover:bg-slate-800/30 transition-colors cursor-pointer flex gap-3 ${!n.read ? 'bg-cyan-950/20' : ''}`}
                          onClick={() => !n.read && markAsReadMutation.mutate(n.id)}
                        >
                          <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${!n.read ? 'bg-cyan-500' : 'bg-transparent'}`} />
                          <div>
                            <p className={`text-sm ${!n.read ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
                              {n.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                            <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-600">
                              <Clock size={10} />
                              {new Date(n.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button 
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-2 p-0.5 rounded-xl hover:bg-white/5 transition-all group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{user?.role}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center border border-white/10">
              <User className="w-5 h-5 text-white" />
            </div>
          </button>
          
          <AnimatePresence>
            {showProfileDropdown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 mt-3 w-56 glass-card p-2 z-50 shadow-2xl border-white/10"
              >
                <div className="px-4 py-3 border-b border-white/5 mb-1">
                  <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email}</p>
                </div>
                
                <button 
                  onClick={() => { setShowProfileDropdown(false); navigate('/profile'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors group"
                >
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>My Profile</span>
                </button>
                
                <button 
                  onClick={() => { setShowProfileDropdown(false); navigate('/settings'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors group"
                >
                  <Settings className="w-4 h-4 text-purple-400" />
                  <span>Settings</span>
                </button>
                
                <div className="h-px bg-white/5 my-1" />
                
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors group"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
