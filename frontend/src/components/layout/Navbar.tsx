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
    <header className="h-14 bg-[#080808] border-b border-white/[0.06] px-6 flex items-center justify-between fixed top-0 left-52 right-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#525252]" />
          <input
            type="text"
            placeholder="Search workflows, executions..."
            className="w-72 bg-[#0e0e0e] border border-white/[0.08] rounded-lg pl-10 pr-4 py-2 text-[#525252] text-sm hover:border-white/[0.14] focus:border-amber-500/40 transition-all placeholder-[#3a3a3a] outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-8 h-8 rounded-lg bg-[#0e0e0e] border border-white/[0.08] flex items-center justify-center text-[#525252] hover:text-[#a1a1a1] hover:border-white/[0.14] transition-all cursor-pointer relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-black text-[10px] font-bold flex items-center justify-center">{unreadCount}</span>
            )}
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 glass-card p-0 z-[60] overflow-hidden flex flex-col max-h-96 border border-white/[0.06] shadow-2xl bg-[#080808]"
              >
                <div className="p-4 border-b border-white/[0.06] flex justify-between items-center bg-[#141414]">
                  <h3 className="text-sm font-bold text-[#fafafa]">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => markAllReadMutation.mutate()}
                      className="text-[10px] text-amber-500 hover:text-amber-400 font-bold uppercase tracking-wider"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {!notifications?.length ? (
                    <div className="p-6 text-center text-[#525252] text-xs font-mono">
                       No notifications yet
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.04]">
                      {notifications.map((n: any) => (
                        <div 
                          key={n.id} 
                          className={`p-4 hover:bg-white/[0.02] transition-colors cursor-pointer flex gap-3 ${!n.read ? 'bg-amber-500/5' : ''}`}
                          onClick={() => !n.read && markAsReadMutation.mutate(n.id)}
                        >
                          <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${!n.read ? 'bg-amber-500' : 'bg-transparent'}`} />
                          <div>
                            <p className={`text-sm tracking-wide ${!n.read ? 'text-[#fafafa] font-semibold' : 'text-[#a1a1a1]'}`}>
                              {n.title}
                            </p>
                            <p className="text-xs text-[#525252] mt-1">{n.message}</p>
                            <div className="flex items-center gap-1 mt-2 text-[10px] text-[#525252] font-mono">
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
            className="flex items-center gap-2 p-0.5 rounded-xl hover:bg-white/[0.04] transition-all group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-[#fafafa]">{user?.name}</p>
              <p className="text-[10px] text-[#525252] font-medium uppercase tracking-wider">{user?.role}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-amber-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer border border-white/[0.06]">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </button>
          
          <AnimatePresence>
            {showProfileDropdown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 mt-3 w-56 bg-[#080808] border border-white/[0.08] p-2 z-50 shadow-2xl rounded-xl"
              >
                <div className="px-4 py-3 border-b border-white/[0.04] mb-1">
                  <p className="text-sm font-bold text-[#fafafa] truncate tracking-tight">{user?.name}</p>
                  <p className="text-[10px] text-[#525252] truncate mt-0.5 tracking-widest font-mono">{user?.email}</p>
                </div>
                
                <button 
                  onClick={() => { setShowProfileDropdown(false); navigate('/profile'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#a1a1a1] hover:text-[#fafafa] hover:bg-white/[0.04] rounded-lg transition-colors group tracking-wide font-medium"
                >
                  <User className="w-4 h-4 text-amber-500" />
                  <span>My Profile</span>
                </button>
                
                <button 
                  onClick={() => { setShowProfileDropdown(false); navigate('/settings'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#a1a1a1] hover:text-[#fafafa] hover:bg-white/[0.04] rounded-lg transition-colors group tracking-wide font-medium"
                >
                  <Settings className="w-4 h-4 text-emerald-400" />
                  <span>Settings</span>
                </button>
                
                <div className="h-px bg-white/[0.04] my-2 mx-2" />
                
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors group tracking-wide font-medium"
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

