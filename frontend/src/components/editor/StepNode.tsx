import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Play, CheckCircle, Bell, Settings2 } from 'lucide-react';

const StepNode = ({ data, selected }: any) => {
  const isApproval = data.type === 'APPROVAL';
  const isNotification = data.type === 'NOTIFICATION';

  const getIcon = () => {
    if (isApproval) return <CheckCircle className="w-5 h-5 text-amber-500" />;
    if (isNotification) return <Bell className="w-5 h-5 text-rose-500" />;
    return <Play className="w-5 h-5 text-emerald-500" />;
  };

  const getTheme = () => {
    if (isApproval) return 'from-amber-500/20 to-amber-500/5 border-amber-500/30';
    if (isNotification) return 'from-rose-500/20 to-rose-500/5 border-rose-500/30';
    return 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30';
  };

  return (
    <div className={`
      relative px-6 py-4 rounded-2xl shadow-2xl border-2 transition-all duration-300 bg-gradient-to-br
      ${getTheme()}
      ${selected ? 'ring-2 ring-white scale-105 border-transparent' : 'border-white/[0.06]'}
      min-w-[200px] bg-[#0e0e0e]
    `}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[#141414] !border-2 !border-[#3a3a3a]" />
      
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-xl bg-white/[0.04]">
          {getIcon()}
        </div>
        <div>
          <p className="text-[10px] font-bold text-[#a1a1a1] uppercase tracking-widest">{data.type}</p>
          <p className="text-sm font-bold text-[#fafafa] tracking-tight">{data.label}</p>
        </div>
      </div>

      <button 
        onClick={() => data.onEdit(data)}
        className="absolute -top-3 -right-3 p-1.5 rounded-full bg-[#141414] border border-white/[0.08] text-[#525252] hover:text-[#fafafa] transition-colors"
      >
        <Settings2 size={12} />
      </button>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[#141414] !border-2 !border-[#3a3a3a]" />
    </div>
  );
};

export default memo(StepNode);

