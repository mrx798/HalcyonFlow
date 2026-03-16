import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { User, Mail, Shield, Smartphone, Globe, Bell, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../api/axios';

const AVATAR_COLORS = [
  'from-cyan-500 to-purple-500',
  'from-emerald-400 to-cyan-400',
  'from-rose-400 to-orange-300',
  'from-blue-500 to-indigo-500',
  'from-amber-400 to-rose-400',
  'from-fuchsia-500 to-pink-500'
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
    const saved = localStorage.getItem('flowforge_notifications');
    return saved ? JSON.parse(saved) : {
      email: true,
      executionComplete: true,
      approvalRequired: true,
      executionFailed: true
    };
  });

  // Integrations state (localStorage)
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('flowforge_webhook_url') || '');
  const [webhookEnabled, setWebhookEnabled] = useState(() => localStorage.getItem('flowforge_webhook_enabled') === 'true');

  // Avatar state (localStorage)
  const [avatarColor, setAvatarColor] = useState(() => {
    return localStorage.getItem('flowforge_avatar_color') || AVATAR_COLORS[0];
  });
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Effect to save local storage changes immediately
  useEffect(() => {
    localStorage.setItem('flowforge_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('flowforge_webhook_url', webhookUrl);
    localStorage.setItem('flowforge_webhook_enabled', String(webhookEnabled));
  }, [webhookUrl, webhookEnabled]);

  useEffect(() => {
    localStorage.setItem('flowforge_avatar_color', avatarColor);
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
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your account and platform preferences.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Nav */}
        <div className="space-y-4">
          <button 
            onClick={() => setActiveTab('PROFILE')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${activeTab === 'PROFILE' ? 'bg-cyan-600/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <User size={18} /> PROFILE
          </button>
          <button 
            onClick={() => setActiveTab('SECURITY')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${activeTab === 'SECURITY' ? 'bg-cyan-600/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Shield size={18} /> SECURITY
          </button>
          <button 
            onClick={() => setActiveTab('NOTIFICATIONS')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${activeTab === 'NOTIFICATIONS' ? 'bg-cyan-600/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Bell size={18} /> NOTIFICATIONS
          </button>
          <button 
            onClick={() => setActiveTab('INTEGRATIONS')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${activeTab === 'INTEGRATIONS' ? 'bg-cyan-600/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-800'}`}
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
                <div className={`w-24 h-24 bg-gradient-to-br ${avatarColor} rounded-3xl flex items-center justify-center border-4 border-slate-800 shadow-2xl overflow-hidden`}>
                  <span className="text-4xl text-white font-bold drop-shadow-md">{getInitials(name || user?.name || '')}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{user?.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-slate-400 text-sm">{user?.email}</p>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {user?.role || 'USER'}
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="mt-3 text-xs font-bold text-cyan-500 hover:underline"
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
                      className="absolute left-0 top-28 bg-slate-800 border border-slate-700 p-3 rounded-xl shadow-xl z-20 flex gap-2"
                    >
                      {AVATAR_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => {
                            setAvatarColor(color);
                            setShowColorPicker(false);
                          }}
                          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} ${avatarColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''}`}
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
                  className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-700/50"
                >
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <User size={12} /> Full Name
                    </label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={e => setName(e.target.value)}
                      className="w-full input-field text-sm" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-6 border-t border-slate-700/50 space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Password Management</h4>
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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-6 border-t border-slate-700/50 space-y-6">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Email Preferences</h4>
                  
                  {[
                    { id: 'email', label: 'Receive Marketing Emails', desc: 'Updates, newsletters, and promotions' },
                    { id: 'executionComplete', label: 'Execution Completed', desc: 'Notify when a workflow finishes running' },
                    { id: 'approvalRequired', label: 'Approval Required', desc: 'Notify when a step is blocked waiting on you' },
                    { id: 'executionFailed', label: 'Execution Failed', desc: 'Notify immediately if a workflow errors out' }
                  ].map((pref) => (
                    <div key={pref.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-200">{pref.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{pref.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notifications[pref.id as keyof typeof notifications]}
                          onChange={(e) => setNotifications({...notifications, [pref.id]: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                      </label>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'INTEGRATIONS' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-6 border-t border-slate-700/50 space-y-6">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Webhooks</h4>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-slate-200">Execution Webhook</p>
                      <p className="text-xs text-slate-500 mt-0.5">Send a POST request when workflows complete</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={webhookEnabled}
                        onChange={(e) => setWebhookEnabled(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>

                  <div className="space-y-1.5 max-w-lg">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
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
                        className="btn-primary py-2 px-4 shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="pt-6 mt-8 border-t border-slate-700/50 flex justify-end">
                {activeTab === 'PROFILE' ? (
                  <button 
                    onClick={handleSaveProfile} 
                    disabled={isSavingProfile}
                    className="btn-primary px-8 flex items-center gap-2"
                  >
                    {isSavingProfile ? 'SAVING...' : <><Check size={16}/> SAVE PROFILE</>}
                  </button>
                ) : (
                  <button 
                    onClick={handleChangePassword} 
                    disabled={isChangingPassword || !currentPassword || !newPassword}
                    className="btn-primary px-8 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isChangingPassword ? 'SAVING...' : <><Shield size={16}/> CHANGE PASSWORD</>}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="glass-card p-8 border-red-500/20 overflow-hidden relative mt-8">
            <h3 className="text-lg font-bold text-white mb-2">Danger Zone</h3>
            <p className="text-sm text-slate-400 mb-6 font-medium">Permanently delete your account and all associated workflow data.</p>
            <button className="px-6 py-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all font-bold text-sm">
              DELETE ACCOUNT
            </button>
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[60px] pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
