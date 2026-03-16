import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Play, CheckCircle, Bell, Settings2 } from 'lucide-react';

const StepNode = ({ data, selected }: any) => {
  const isApproval = data.type === 'APPROVAL';
  const isNotification = data.type === 'NOTIFICATION';

  const getIcon = () => {
    if (isApproval) return <CheckCircle className="w-5 h-5 text-amber-500" />;
    if (isNotification) return <Bell className="w-5 h-5 text-cyan-500" />;
    return <Play className="w-5 h-5 text-purple-500" />;
  };

  const getTheme = () => {
    if (isApproval) return 'from-amber-500/20 to-amber-500/5 border-amber-500/30';
    if (isNotification) return 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30';
    return 'from-purple-500/20 to-purple-500/5 border-purple-500/30';
  };

  return (
    <div className={`
      relative px-6 py-4 rounded-2xl shadow-2xl border-2 transition-all duration-300 bg-gradient-to-br
      ${getTheme()}
      ${selected ? 'ring-2 ring-white scale-105 border-transparent' : 'border-slate-700/50'}
      min-w-[200px] glass
    `}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-slate-700 !border-2 !border-slate-900" />
      
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-xl bg-slate-900/50">
          {getIcon()}
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{data.type}</p>
          <p className="text-sm font-bold text-slate-200">{data.label}</p>
        </div>
      </div>

      <button 
        onClick={() => data.onEdit(data)}
        className="absolute -top-3 -right-3 p-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
      >
        <Settings2 size={12} />
      </button>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-slate-700 !border-2 !border-slate-900" />
    </div>
  );
};

export default memo(StepNode);
