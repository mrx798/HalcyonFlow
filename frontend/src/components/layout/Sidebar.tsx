import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlayCircle, 
  Settings, 
  Bell, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Workflow
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { title: 'Workflows', icon: Workflow, path: '/workflows' },
    { title: 'Executions', icon: PlayCircle, path: '/executions' },
    { title: 'Notifications', icon: Bell, path: '/notifications' },
    { title: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 260 }}
      className="glass border-r border-slate-700/50 flex flex-col h-screen sticky top-0"
    >
      <div className="p-6 flex items-center justify-between">
        {!collapsed && (
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
          >
            FlowForge
          </motion.h1>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 group
              ${isActive 
                ? 'bg-cyan-600/10 text-cyan-400 border border-cyan-500/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
            `}
          >
            <item.icon size={22} className="shrink-0" />
            {!collapsed && <span className="font-medium">{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all group"
        >
          <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
          {!collapsed && <span className="font-bold text-sm tracking-tight">Sign Out</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
