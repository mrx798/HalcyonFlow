import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlayCircle, 
  Settings, 
  Bell, 
  LogOut,
  Workflow,
  Zap
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const Sidebar: React.FC = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { title: 'Workflows', icon: Workflow, path: '/workflows' },
    { title: 'Audit Log', icon: PlayCircle, path: '/executions' },
  ];
  
  const bottomItems = [
    { title: 'Notifications', icon: Bell, path: '/notifications' },
    { title: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <aside className="bg-[#080808] border-r border-white/[0.06] w-52 fixed left-0 top-0 bottom-0 flex flex-col z-50">
      
      <div className="h-14 border-b border-white/[0.06] px-4 flex items-center gap-2">
        <Zap className="text-amber-400 text-lg" size={20} fill="currentColor" />
        <span className="text-[#fafafa] font-semibold text-base tracking-tight">HalcyonFlow</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="text-[#3a3a3a] text-[10px] uppercase tracking-widest px-3 mb-1">Menu</div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              ${isActive 
                ? 'flex items-center gap-3 px-3 py-2 rounded-lg text-[#fafafa] bg-white/[0.06] text-sm font-medium' 
                : 'flex items-center gap-3 px-3 py-2 rounded-lg text-[#525252] text-sm hover:text-[#a1a1a1] hover:bg-white/[0.04] transition-all duration-100 cursor-pointer'}
            `}
          >
            <item.icon size={16} className="shrink-0" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </div>

      <div className="px-3 py-4 border-t border-white/[0.06] space-y-1">
        <div className="text-[#3a3a3a] text-[10px] uppercase tracking-widest px-3 mb-1 mt-2">Personal</div>
        {bottomItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              ${isActive 
                ? 'flex items-center gap-3 px-3 py-2 rounded-lg text-[#fafafa] bg-white/[0.06] text-sm font-medium' 
                : 'flex items-center gap-3 px-3 py-2 rounded-lg text-[#525252] text-sm hover:text-[#a1a1a1] hover:bg-white/[0.04] transition-all duration-100 cursor-pointer'}
            `}
          >
            <item.icon size={16} className="shrink-0" />
            <span>{item.title}</span>
          </NavLink>
        ))}

        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 mt-2 rounded-lg text-[#525252] text-sm hover:text-red-400 hover:bg-red-500/10 transition-all duration-100 cursor-pointer"
        >
          <LogOut size={16} className="shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

