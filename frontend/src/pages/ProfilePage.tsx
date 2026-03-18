import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { User as UserIcon, Mail, Shield, Smartphone, Key, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api from '../api/axios';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.put('/auth/profile', { name });
      if (user) {
        updateUser({ ...user, name: response.data.data.name });
      }
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-semibold text-[#fafafa] tracking-tight">Your Profile</h1>
        <p className="text-[#a1a1a1] mt-1 font-mono text-sm">Manage your identity and personal information.</p>
      </motion.div>

      <div className="glass-card p-8 space-y-8">
        <div className="flex items-center gap-8">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-rose-500 rounded-3xl flex items-center justify-center border-4 border-[#141414] shadow-2xl relative">
            <UserIcon size={40} className="text-[#141414]" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#080808]" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-[#fafafa] tracking-tight">{user?.name}</h3>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold uppercase tracking-widest">
                {user?.role}
              </span>
            </div>
            <p className="text-[#a1a1a1] font-mono text-sm flex items-center gap-2">
              <Mail size={14} className="text-[#525252]" /> {user?.email}
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6 pt-6 border-t border-white/[0.06]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#525252] uppercase tracking-widest flex items-center gap-2">
                <UserIcon size={12} /> Full Name
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditing}
                className={`w-full input-field text-sm ${!isEditing ? 'opacity-50' : ''}`} 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#525252] uppercase tracking-widest flex items-center gap-2">
                <Mail size={12} /> Email Address
              </label>
              <input 
                type="email" 
                value={user?.email} 
                disabled 
                className="w-full input-field text-sm opacity-50 cursor-not-allowed" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#525252] uppercase tracking-widest flex items-center gap-2">
                <Smartphone size={12} /> Account ID
              </label>
              <input 
                type="text" 
                value={user?.id} 
                disabled 
                className="w-full input-field text-xs opacity-50 font-mono" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#525252] uppercase tracking-widest flex items-center gap-2">
                <Shield size={12} /> Security Level
              </label>
              <div className="flex items-center gap-2 px-4 py-3 bg-[#141414] rounded-xl border border-white/[0.08]">
                <Key size={14} className="text-amber-500" />
                <span className="text-xs text-[#a1a1a1] font-mono">Standard Encryption</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-end mt-8">
            {!isEditing ? (
              <button 
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 rounded-lg bg-[#141414] border border-white/[0.08] text-[#a1a1a1] hover:bg-white/[0.04] transition-all font-bold text-[10px] tracking-widest uppercase"
              >
                EDIT PROFILE
              </button>
            ) : (
              <>
                <button 
                  type="button"
                  onClick={() => { setIsEditing(false); setName(user?.name || ''); }}
                  className="px-6 py-2 rounded-lg bg-[#141414] border border-white/[0.08] text-[#525252] hover:text-[#fafafa] transition-all font-bold text-[10px] tracking-widest uppercase"
                >
                  CANCEL
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center gap-2 px-6 py-2 tracking-widest uppercase font-bold text-xs"
                >
                  <Save size={16} /> {isLoading ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      <div className="glass-card p-8 border border-red-500/20 overflow-hidden relative shadow-2xl mt-8 pt-10">
        <h3 className="text-xl font-bold text-[#fafafa] mb-2 tracking-tight">Security Center</h3>
        <p className="text-sm text-[#a1a1a1] mb-6 font-medium">To change your password or delete your account, please visit the main Settings page.</p>
        <button 
          onClick={() => window.location.href = '/settings'}
          className="px-6 py-3 rounded-lg bg-[#141414] border border-white/[0.08] text-[#a1a1a1] hover:bg-white/[0.06] hover:text-[#fafafa] transition-all font-bold text-[10px] tracking-widest uppercase"
        >
          VIEW SETTINGS
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;

