'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { showToast, toastMessages } from '@/lib/toast-config';
import { 
  Bell, 
  Mail, 
  Shield, 
  Save, 
  Loader2, 
  Check,
  Settings,
  User,
  Globe
} from 'lucide-react';

export default function UserPreferences({ isOpen, onClose }) {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    isNotificationOn: true,
    acceptedTerms: false,
    emailPreferences: {
      welcomeEmails: true,
      resumeUpdates: true,
      jobMatches: true,
      weeklyDigest: true,
      applicationReminders: true,
      marketingEmails: false
    }
  });

  // Load user preferences on component mount
  const loadPreferences = async () => {
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/user/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      } else {
        showToast('Failed to load preferences', 'error');
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      showToast('Error loading preferences', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isOpen) {
      loadPreferences();
    }
  }, [user, isOpen]);

  const savePreferences = async () => {
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        showToast.success('Preferences saved successfully!');
      } else {
        showToast.error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      showToast.error('Error saving preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailPreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      emailPreferences: {
        ...prev.emailPreferences,
        [key]: value
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="bg-gray-900 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <Settings className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Preferences</h2>
                <p className="text-gray-400">Manage your notification settings</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2"
            >
              ✕
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Master Notification Toggle */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-800/50 rounded-xl p-4 border border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-purple-400" />
                    <div>
                      <h3 className="text-white font-semibold">Email Notifications</h3>
                      <p className="text-gray-400 text-sm">Receive updates about your account activity</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.isNotificationOn}
                      onChange={(e) => setPreferences(prev => ({ ...prev, isNotificationOn: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </motion.div>

              {/* Email Preferences */}
              <AnimatePresence>
                {preferences.isNotificationOn && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Mail className="w-5 h-5 text-blue-400" />
                      <h3 className="text-white font-semibold">Email Types</h3>
                    </div>

                    {[
                      { key: 'welcomeEmails', label: 'Welcome Messages', desc: 'Account creation and onboarding emails' },
                      { key: 'resumeUpdates', label: 'Resume Enhancements', desc: 'Notifications when your resume is enhanced' },
                      { key: 'jobMatches', label: 'Job Matches', desc: 'New job opportunities that match your profile' },
                      { key: 'weeklyDigest', label: 'Weekly Summary', desc: 'Weekly recap of your activity and progress' },
                      { key: 'applicationReminders', label: 'Application Reminders', desc: 'Follow-up reminders for job applications' },
                      { key: 'marketingEmails', label: 'Product Updates', desc: 'New features and product announcements' }
                    ].map((item, index) => (
                      <motion.div
                        key={item.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-medium">{item.label}</h4>
                            <p className="text-gray-400 text-sm">{item.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={preferences.emailPreferences[item.key]}
                              onChange={(e) => handleEmailPreferenceChange(item.key, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Terms & Privacy */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-800/50 rounded-xl p-4 border border-gray-700"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-5 h-5 text-green-400" />
                  <h3 className="text-white font-semibold">Privacy & Terms</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">
                      Terms and Conditions accepted
                    </p>
                    <p className="text-gray-500 text-xs">
                      {preferences.acceptedTerms ? 'You have accepted our terms' : 'Terms acceptance required'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {preferences.acceptedTerms ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <a 
                        href="https://rolefitai.vercel.app/terms" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 text-sm underline"
                      >
                        Review Terms
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Account Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50"
              >
                <div className="flex items-center gap-3 mb-3">
                  <User className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-white font-semibold">Account Information</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white">{user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Account Type:</span>
                    <span className="text-purple-400">Free Plan</span>
                  </div>
                </div>
              </motion.div>

              {/* Save Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex gap-3 pt-4"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={savePreferences}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Preferences
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </motion.button>
              </motion.div>

              {/* Footer */}
              <div className="flex items-center justify-center gap-4 pt-4 text-xs text-gray-500">
                <a 
                  href="https://rolefitai.vercel.app/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-purple-400 transition-colors flex items-center gap-1"
                >
                  <Globe className="w-3 h-3" />
                  Privacy Policy
                </a>
                <span>•</span>
                <a 
                  href="https://rolefitai.vercel.app/terms" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-purple-400 transition-colors"
                >
                  Terms of Service
                </a>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
