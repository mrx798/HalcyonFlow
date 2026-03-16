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
      const response = await api.post('/auth/me', { name });
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
        <h1 className="text-3xl font-bold text-white">Your Profile</h1>
        <p className="text-slate-400 mt-1">Manage your identity and personal information.</p>
      </motion.div>

      <div className="glass-card p-8 space-y-8">
        <div className="flex items-center gap-8">
          <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-3xl flex items-center justify-center border-4 border-slate-800 shadow-2xl relative">
            <UserIcon size={40} className="text-white" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-slate-900" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-white">{user?.name}</h3>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold uppercase tracking-wider">
                {user?.role}
              </span>
            </div>
            <p className="text-slate-400 text-sm flex items-center gap-2">
              <Mail size={14} /> {user?.email}
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6 pt-6 border-t border-slate-700/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
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
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
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
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
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
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Shield size={12} /> Security Level
              </label>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700">
                <Key size={14} className="text-amber-500" />
                <span className="text-xs text-slate-300">Standard Encryption</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            {!isEditing ? (
              <button 
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all font-bold text-sm"
              >
                EDIT PROFILE
              </button>
            ) : (
              <>
                <button 
                  type="button"
                  onClick={() => { setIsEditing(false); setName(user?.name || ''); }}
                  className="px-6 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition-all font-bold text-sm"
                >
                  CANCEL
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center gap-2 px-6 py-2"
                >
                  <Save size={16} /> {isLoading ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      <div className="glass-card p-8 border-red-500/20 overflow-hidden relative">
        <h3 className="text-lg font-bold text-white mb-2 font-display uppercase tracking-tight">Security Center</h3>
        <p className="text-sm text-slate-400 mb-6 font-medium">To change your password or delete your account, please visit the main Settings page.</p>
        <button 
          onClick={() => window.location.href = '/settings'}
          className="px-6 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all font-bold text-sm"
        >
          VIEW SETTINGS
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
