'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../lib/firebase';
import { showToast, toastMessages } from '@/lib/toast-config';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  User, 
  Bell, 
  Mail, 
  Shield, 
  Save, 
  Loader2, 
  Check,
  Globe,
  CreditCard,
  Database,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle
} from 'lucide-react';

export default function SettingsPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [userData, setUserData] = useState({
    displayName: '',
    email: '',
    credits: 0,
    isPro: false,
    acceptedTerms: false,
    isNotificationOn: true,
    emailPreferences: {
      welcomeEmails: true,
      resumeUpdates: true,
      jobMatches: true,
      weeklyDigest: true,
      applicationReminders: true,
      marketingEmails: false
    }
  });

  const loadUserData = async () => {
    setLoadingData(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/user/sync', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserData({
          displayName: data.user.displayName || user.displayName || '',
          email: data.user.email || user.email || '',
          credits: data.user.credits || 0,
          isPro: data.user.isPro || false,
          acceptedTerms: data.user.acceptedTerms || false,
          isNotificationOn: data.user.isNotificationOn ?? true,
          emailPreferences: data.user.emailPreferences || {
            welcomeEmails: true,
            resumeUpdates: true,
            jobMatches: true,
            weeklyDigest: true,
            applicationReminders: true,
            marketingEmails: false
          }
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      showToast('Failed to load user data', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/');
      return;
    }
    loadUserData();
  }, [user, loading, router]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          acceptedTerms: userData.acceptedTerms,
          isNotificationOn: userData.isNotificationOn,
          emailPreferences: userData.emailPreferences
        })
      });

      if (response.ok) {
        showToast('Settings saved successfully!', 'success');
      } else {
        showToast('Failed to save settings', 'error');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Error saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailPreferenceChange = (key, value) => {
    setUserData(prev => ({
      ...prev,
      emailPreferences: {
        ...prev.emailPreferences,
        [key]: value
      }
    }));
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'account', label: 'Account', icon: Settings }
  ];

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-600/20 rounded-xl">
              <Settings className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Settings</h1>
              <p className="text-gray-400">Manage your account preferences and privacy settings</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8">
              <AnimatePresence mode="wait">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <User className="w-6 h-6 text-purple-400" />
                      <h2 className="text-2xl font-bold text-white">Profile Information</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={userData.displayName}
                          onChange={(e) => setUserData(prev => ({ ...prev, displayName: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Your display name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={userData.email}
                          disabled
                          className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600 rounded-xl text-gray-400 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                      </div>
                    </div>

                    <div className="bg-gray-700/30 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-green-400" />
                          <h3 className="text-lg font-semibold text-white">Account Status</h3>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          userData.isPro 
                            ? 'bg-purple-600/20 text-purple-400' 
                            : 'bg-gray-600/20 text-gray-400'
                        }`}>
                          {userData.isPro ? 'Pro Plan' : 'Free Plan'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400 text-sm">Available Credits</p>
                          <p className="text-2xl font-bold text-white">{userData.credits}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Plan Type</p>
                          <p className="text-lg font-semibold text-white">
                            {userData.isPro ? 'Professional' : 'Free'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <Bell className="w-6 h-6 text-purple-400" />
                      <h2 className="text-2xl font-bold text-white">Notification Preferences</h2>
                    </div>

                    {/* Master Toggle */}
                    <div className="bg-gray-700/30 rounded-xl p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-purple-400" />
                          <div>
                            <h3 className="text-lg font-semibold text-white">Email Notifications</h3>
                            <p className="text-gray-400 text-sm">Receive updates about your account activity</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={userData.isNotificationOn}
                            onChange={(e) => setUserData(prev => ({ ...prev, isNotificationOn: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* Email Preferences */}
                    <AnimatePresence>
                      {userData.isNotificationOn && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                          {[
                            { key: 'welcomeEmails', label: 'Welcome Messages', desc: 'Account creation and onboarding emails' },
                            { key: 'resumeUpdates', label: 'Resume Enhancements', desc: 'Notifications when your resume is enhanced' },
                            { key: 'jobMatches', label: 'Job Matches', desc: 'New job opportunities that match your profile' },
                            { key: 'weeklyDigest', label: 'Weekly Summary', desc: 'Weekly recap of your activity and progress' },
                            { key: 'applicationReminders', label: 'Application Reminders', desc: 'Follow-up reminders for job applications' },
                            { key: 'marketingEmails', label: 'Product Updates', desc: 'New features and product announcements' }
                          ].map((item) => (
                            <div key={item.key} className="bg-gray-700/20 rounded-xl p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-white font-medium">{item.label}</h4>
                                  <p className="text-gray-400 text-sm">{item.desc}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={userData.emailPreferences[item.key]}
                                    onChange={(e) => handleEmailPreferenceChange(item.key, e.target.checked)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Privacy Tab */}
                {activeTab === 'privacy' && (
                  <motion.div
                    key="privacy"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <Shield className="w-6 h-6 text-purple-400" />
                      <h2 className="text-2xl font-bold text-white">Privacy & Security</h2>
                    </div>

                    <div className="bg-gray-700/30 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Check className="w-5 h-5 text-green-400" />
                        <h3 className="text-lg font-semibold text-white">Terms & Conditions</h3>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-300">
                            {userData.acceptedTerms ? 'You have accepted our terms and conditions' : 'Terms acceptance required'}
                          </p>
                          <p className="text-gray-500 text-sm">
                            Last updated: December 2024
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {userData.acceptedTerms ? (
                            <Check className="w-5 h-5 text-green-400" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-yellow-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-700/30 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Database className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-semibold text-white">Data Storage</h3>
                      </div>
                      <div className="space-y-3 text-gray-300">
                        <p>• Your data is encrypted and stored securely</p>
                        <p>• We use Firebase and MongoDB for data storage</p>
                        <p>• You can request data deletion at any time</p>
                        <p>• We comply with GDPR and privacy regulations</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <a 
                        href="https://rolefitai.vercel.app/privacy" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-colors"
                      >
                        <Globe className="w-4 h-4" />
                        Privacy Policy
                      </a>
                      <a 
                        href="https://rolefitai.vercel.app/terms" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                        Terms of Service
                      </a>
                    </div>
                  </motion.div>
                )}

                {/* Account Tab */}
                {activeTab === 'account' && (
                  <motion.div
                    key="account"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <Settings className="w-6 h-6 text-purple-400" />
                      <h2 className="text-2xl font-bold text-white">Account Management</h2>
                    </div>

                    <div className="bg-gray-700/30 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Account Type</p>
                          <p className="text-white font-medium">{userData.isPro ? 'Professional' : 'Free'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Member Since</p>
                          <p className="text-white font-medium">December 2024</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
                      </div>
                      <p className="text-gray-300 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors border border-red-600/30"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Account
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Save Button */}
              <div className="flex justify-end mt-8 pt-6 border-t border-gray-700/50">
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-red-700/50"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Delete Account</h3>
                <p className="text-gray-400">This action cannot be undone. All your data will be permanently deleted.</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Implement account deletion logic here
                    showToast.error('Account deletion not implemented yet');
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
