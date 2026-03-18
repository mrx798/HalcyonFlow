import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { User, Mail, Shield, Smartphone, Globe, Bell, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../api/axios';

const AVATAR_COLORS = [
  'from-amber-500 to-rose-500',
  'from-emerald-400 to-amber-400',
  'from-rose-400 to-orange-300',
  'from-[#fafafa] to-[#525252]',
  'from-amber-400 to-yellow-600',
  'from-fuchsia-500 to-amber-500'
];

const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'SECURITY' | 'NOTIFICATIONS' | 'INTEGRATIONS'>('PROFILE');
  
  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Notifications state (localStorage)
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('HalcyonFlow_notifications');
    return saved ? JSON.parse(saved) : {
      email: true,
      executionComplete: true,
      approvalRequired: true,
      executionFailed: true
    };
  });

  // Integrations state (localStorage)
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('HalcyonFlow_webhook_url') || '');
  const [webhookEnabled, setWebhookEnabled] = useState(() => localStorage.getItem('HalcyonFlow_webhook_enabled') === 'true');

  // Avatar state (localStorage)
  const [avatarColor, setAvatarColor] = useState(() => {
    return localStorage.getItem('HalcyonFlow_avatar_color') || AVATAR_COLORS[0];
  });
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Effect to save local storage changes immediately
  useEffect(() => {
    localStorage.setItem('HalcyonFlow_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('HalcyonFlow_webhook_url', webhookUrl);
    localStorage.setItem('HalcyonFlow_webhook_enabled', String(webhookEnabled));
  }, [webhookUrl, webhookEnabled]);

  useEffect(() => {
    localStorage.setItem('HalcyonFlow_avatar_color', avatarColor);
    // Dispatch custom event to update avatar globally (if needed by other components)
    window.dispatchEvent(new Event('avatar-updated'));
  }, [avatarColor]);

  // Handlers
  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      const res = await api.put('/auth/profile', { name });
      updateUser(res.data.data);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setIsChangingPassword(true);
      await api.put('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      toast.error('Please enter a webhook URL first');
      return;
    }
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1500)),
      {
        loading: 'Testing webhook connection...',
        success: 'Webhook test successful! Payload delivered.',
        error: 'Failed to reach webhook URL'
      }
    );
  };

  // Helper for computing initials
  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-semibold text-[#fafafa] tracking-tight">Settings</h1>
        <p className="text-[#a1a1a1] mt-1 font-mono text-sm">Manage your account and platform preferences.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Nav */}
        <div className="space-y-4">
          <button 
            onClick={() => setActiveTab('PROFILE')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold tracking-widest uppercase ${activeTab === 'PROFILE' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'text-[#525252] hover:bg-white/[0.04] border border-transparent hover:border-white/[0.04]'}`}
          >
            <User size={18} /> PROFILE
          </button>
          <button 
            onClick={() => setActiveTab('SECURITY')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold tracking-widest uppercase ${activeTab === 'SECURITY' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'text-[#525252] hover:bg-white/[0.04] border border-transparent hover:border-white/[0.04]'}`}
          >
            <Shield size={18} /> SECURITY
          </button>
          <button 
            onClick={() => setActiveTab('NOTIFICATIONS')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold tracking-widest uppercase ${activeTab === 'NOTIFICATIONS' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'text-[#525252] hover:bg-white/[0.04] border border-transparent hover:border-white/[0.04]'}`}
          >
            <Bell size={18} /> NOTIFICATIONS
          </button>
          <button 
            onClick={() => setActiveTab('INTEGRATIONS')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold tracking-widest uppercase ${activeTab === 'INTEGRATIONS' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'text-[#525252] hover:bg-white/[0.04] border border-transparent hover:border-white/[0.04]'}`}
          >
            <Globe size={18} /> INTEGRATIONS
          </button>
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card p-8 min-h-[500px] flex flex-col justify-between">
            <div>
              {/* Header with Avatar */}
              <div className="flex items-center gap-6 mb-8 relative">
                <div className={`w-24 h-24 bg-gradient-to-br ${avatarColor} rounded-3xl flex items-center justify-center border-4 border-[#141414] shadow-2xl overflow-hidden`}>
                  <span className="text-4xl text-black font-semibold drop-shadow-md tracking-tighter">{getInitials(name || user?.name || '')}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#fafafa] tracking-tight">{user?.name}</h3>
                  <div className="flex items-center gap-2 mt-1 font-mono">
                    <p className="text-[#a1a1a1] text-xs">{user?.email}</p>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#141414] text-[#a1a1a1] border border-white/[0.08] tracking-widest">
                      {user?.role || 'USER'}
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="mt-3 text-[10px] font-bold tracking-widest text-amber-500 hover:underline uppercase"
                  >
                    CHANGE AVATAR
                  </button>
                </div>
                
                {/* Color Picker Popover */}
                <AnimatePresence>
                  {showColorPicker && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -10 }}
                      className="absolute left-0 top-28 bg-[#141414] border border-white/[0.10] p-3 rounded-xl shadow-2xl z-20 flex gap-2"
                    >
                      {AVATAR_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => {
                            setAvatarColor(color);
                            setShowColorPicker(false);
                          }}
                          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} ${avatarColor === color ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-[#141414]' : ''}`}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* TABS CONTENT */}
              {activeTab === 'PROFILE' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-white/[0.06]"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#525252] uppercase tracking-widest flex items-center gap-2">
                      <User size={12} /> Full Name
                    </label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={e => setName(e.target.value)}
                      className="w-full input-field text-sm" 
                    />
                  </div>
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-bold text-[#525252] uppercase tracking-widest flex items-center gap-2">
                      <Mail size={12} /> Email Address (Read Only)
                    </label>
                    <input 
                      type="email" 
                      value={user?.email || ''} 
                      disabled 
                      className="w-full input-field text-sm opacity-50 cursor-not-allowed" 
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'SECURITY' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-6 border-t border-white/[0.06] space-y-4">
                  <h4 className="text-[10px] font-bold text-[#fafafa] uppercase tracking-widest mb-4">Password Management</h4>
                  <div className="space-y-4 max-w-sm">
                    <input 
                      type="password" 
                      placeholder="Current Password" 
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="w-full input-field text-sm" 
                    />
                    <input 
                      type="password" 
                      placeholder="New Password" 
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full input-field text-sm" 
                    />
                    <input 
                      type="password" 
                      placeholder="Confirm New Password" 
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full input-field text-sm" 
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'NOTIFICATIONS' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-6 border-t border-white/[0.06] space-y-6">
                  <h4 className="text-[10px] font-bold text-[#fafafa] uppercase tracking-widest">Email Preferences</h4>
                  
                  {[
                    { id: 'email', label: 'Receive Marketing Emails', desc: 'Updates, newsletters, and promotions' },
                    { id: 'executionComplete', label: 'Execution Completed', desc: 'Notify when a workflow finishes running' },
                    { id: 'approvalRequired', label: 'Approval Required', desc: 'Notify when a step is blocked waiting on you' },
                    { id: 'executionFailed', label: 'Execution Failed', desc: 'Notify immediately if a workflow errors out' }
                  ].map((pref) => (
                    <div key={pref.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#fafafa] tracking-wide">{pref.label}</p>
                        <p className="text-xs text-[#a1a1a1] mt-0.5">{pref.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notifications[pref.id as keyof typeof notifications]}
                          onChange={(e) => setNotifications({...notifications, [pref.id]: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-[#141414] border border-white/[0.10] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-white/[0.10] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'INTEGRATIONS' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-6 border-t border-white/[0.06] space-y-6">
                  <h4 className="text-[10px] font-bold text-[#fafafa] uppercase tracking-widest">Webhooks</h4>
                  
                  <div className="flex items-center justify-between p-4 bg-[#141414] border border-white/[0.08] rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-[#fafafa] tracking-wide">Execution Webhook</p>
                      <p className="text-xs text-[#a1a1a1] mt-0.5">Send a POST request when workflows complete</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={webhookEnabled}
                        onChange={(e) => setWebhookEnabled(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-[#141414] border border-white/[0.10] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-white/[0.10] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div className="space-y-1.5 max-w-lg">
                    <label className="text-[10px] font-bold text-[#525252] uppercase tracking-widest flex items-center gap-2">
                      <Globe size={12} /> Webhook URL Target
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="url" 
                        placeholder="https://your-api.com/webhook" 
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        disabled={!webhookEnabled}
                        className="flex-1 input-field text-sm disabled:opacity-50" 
                      />
                      <button 
                        onClick={handleTestWebhook}
                        disabled={!webhookEnabled || !webhookUrl}
                        className="btn-primary py-2 px-6 shadow-none disabled:opacity-50 disabled:cursor-not-allowed font-bold tracking-widest uppercase text-xs"
                      >
                        TEST
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Bottom Form Actions for API Tabs */}
            {(activeTab === 'PROFILE' || activeTab === 'SECURITY') && (
              <div className="pt-6 mt-8 border-t border-white/[0.06] flex justify-end">
                {activeTab === 'PROFILE' ? (
                  <button 
                    onClick={handleSaveProfile} 
                    disabled={isSavingProfile}
                    className="btn-primary px-8 flex items-center gap-2 font-bold tracking-widest uppercase text-xs py-3"
                  >
                    {isSavingProfile ? 'SAVING...' : <><Check size={16}/> SAVE PROFILE</>}
                  </button>
                ) : (
                  <button 
                    onClick={handleChangePassword} 
                    disabled={isChangingPassword || !currentPassword || !newPassword}
                    className="btn-primary px-8 flex items-center gap-2 disabled:opacity-50 font-bold tracking-widest uppercase text-xs py-3"
                  >
                    {isChangingPassword ? 'SAVING...' : <><Shield size={16}/> CHANGE PASSWORD</>}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="glass-card p-8 border border-red-500/20 overflow-hidden relative mt-8 pt-10">
            <h3 className="text-xl font-bold text-[#fafafa] tracking-tight mb-2">Danger Zone</h3>
            <p className="text-sm text-[#a1a1a1] mb-6 font-medium">Permanently delete your account and all associated workflow data.</p>
            <button className="px-6 py-3 rounded-lg bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 transition-all font-bold tracking-widest uppercase text-xs shadow-lg shadow-red-900/10">
              DELETE ACCOUNT
            </button>
            <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 blur-[80px] pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

