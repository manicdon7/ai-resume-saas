'use client';

import { useState, useEffect } from 'react';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';
import { X, Mail, Lock, User, Eye, EyeOff, Sparkles, Shield, Zap } from 'lucide-react';
import { showToast, toastMessages } from '@/lib/toast-config';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [showGoogleTermsModal, setShowGoogleTermsModal] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);
  const [googleAcceptTerms, setGoogleAcceptTerms] = useState(false);
  const [googleEmailNotifications, setGoogleEmailNotifications] = useState(true);

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // For Google sign-in, show terms modal if user hasn't accepted terms
      const token = await result.user.getIdToken();
      const userResponse = await fetch('/api/user/sync', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      let needsTermsAcceptance = true;
      if (userResponse.ok) {
        const userData = await userResponse.json();
        needsTermsAcceptance = !userData.user?.acceptedTerms;
      }

      if (needsTermsAcceptance) {
        // Show terms acceptance modal for Google users
        setShowGoogleTermsModal(true);
        setGoogleUser(result.user);
      } else {
        // User already accepted terms, proceed normally
        await syncUserData(result.user, true, true, {
          welcomeEmails: true,
          resumeUpdates: true,
          jobMatches: true,
          weeklyDigest: true,
          applicationReminders: true,
          marketingEmails: false
        });
        
        showToast.success(toastMessages.auth.loginSuccess);
        onSuccess?.(result.user);
        onClose();
      }
    } catch (error) {
      console.error('Google auth error:', error);
      showToast.error(toastMessages.auth.loginError);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (!acceptTerms) {
          showToast.error('Please accept the Terms and Conditions to continue');
          setLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          showToast.error('Passwords do not match');
          setLoading(false);
          return;
        }
        const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        
        // Sync user data with MongoDB and Firebase
        await syncUserData(result.user, true, emailNotifications, {
          welcomeEmails: true,
          resumeUpdates: emailNotifications,
          jobMatches: emailNotifications,
          weeklyDigest: emailNotifications,
          applicationReminders: emailNotifications,
          marketingEmails: false
        }, true);

        showToast.success(toastMessages.auth.signupSuccess);
        onSuccess?.(result.user);
      } else {
        const result = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        showToast.success(toastMessages.auth.loginSuccess);
        onSuccess?.(result.user);
      }
      onClose();
      setFormData({ email: '', password: '', confirmPassword: '', name: '' });
      setAcceptTerms(false);
      setEmailNotifications(true);
    } catch (error) {
      console.error('Auth error:', error);
      let errorMessage = error.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : error.message;

      if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password sign-in is not enabled. Please use Google sign-in.';
      }
      if (error.code === 'auth/invalid-api-key' || error.message.includes('API key')) {
        errorMessage = 'Invalid Firebase API key. Please check your Firebase configuration.';
      }
      if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      }

      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Sync user data with MongoDB and Firebase
  const syncUserData = async (user, acceptedTerms, isNotificationOn, emailPreferences, isNewUser = false) => {
    try {
      const token = await user.getIdToken();
      await fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          acceptedTerms,
          isNotificationOn,
          emailPreferences,
          isNewUser
        })
      });
    } catch (error) {
      console.error('Error syncing user data:', error);
      showToast.error('Failed to sync user data');
    }
  };

  // Handle Google terms acceptance
  const handleGoogleTermsAcceptance = async () => {
    if (!googleAcceptTerms) {
      showToast.error('Please accept the Terms and Conditions to continue');
      return;
    }

    setLoading(true);
    try {
      await syncUserData(googleUser, true, googleEmailNotifications, {
        welcomeEmails: true,
        resumeUpdates: googleEmailNotifications,
        jobMatches: googleEmailNotifications,
        weeklyDigest: googleEmailNotifications,
        applicationReminders: googleEmailNotifications,
        marketingEmails: false
      }, true);

      showToast.success(toastMessages.auth.loginSuccess);
      onSuccess?.(googleUser);
      setShowGoogleTermsModal(false);
      onClose();
    } catch (error) {
      console.error('Error completing Google sign-in:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="auth-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
        <motion.div 
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-black/95 backdrop-blur-2xl rounded-3xl p-8 w-full max-w-md border border-purple-500/20 shadow-2xl shadow-purple-500/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-600/5 via-blue-600/5 to-cyan-600/5 animate-pulse" />
            <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full blur-xl animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3s' }} />
            <div className="absolute -bottom-10 -left-10 w-16 h-16 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full blur-xl animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }} />
          </div>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl transition-all duration-200 group z-10"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          </button>

          {/* Header */}
          <div className="relative z-10 text-center mb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold mb-2"
            >
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {isSignUp ? 'Join RoleFitAI' : 'Welcome Back'}
              </span>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-400 text-sm"
            >
              {isSignUp ? 'Create your account and start building amazing resumes' : 'Sign in to continue your journey'}
            </motion.p>
          </div>

          <div className="relative z-10 space-y-6">
            {/* Google Sign In */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 disabled:opacity-50 text-white group backdrop-blur-sm shadow-lg hover:shadow-xl"
            >
              <div className="w-5 h-5 bg-white rounded-sm flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <span className="font-medium">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  'Continue with Google'
                )}
              </span>
            </motion.button>

            {/* Divider */}
            <motion.div 
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.6 }}
              className="relative my-8"
            >
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gradient-to-r from-slate-900 via-gray-900 to-black text-gray-400 font-medium">Or continue with email</span>
              </div>
            </motion.div>

            {/* Email Form */}
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              onSubmit={handleEmailAuth} 
              className="space-y-5"
            >
              <AnimatePresence mode="wait">
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Full Name
                    </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        name="name"
                        className="w-full pl-12 pr-4 py-4 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-white/10 transition-all duration-300 outline-none"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-white/10 transition-all duration-300 outline-none"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-12 pr-12 py-4 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-white/10 transition-all duration-300 outline-none"
                    placeholder="Enter your password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full pl-12 pr-12 py-4 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-white/10 transition-all duration-300 outline-none"
                        placeholder="Confirm your password"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Terms and Conditions */}
                  <motion.div 
                    className="flex items-start space-x-3"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      required
                    />
                    <label htmlFor="acceptTerms" className="text-sm text-gray-600 leading-5">
                      I agree to the{' '}
                      <a 
                        href="https://rolefitai.vercel.app/terms" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-700 underline transition-colors"
                      >
                        Terms and Conditions
                      </a>{' '}
                      and{' '}
                      <a 
                        href="https://rolefitai.vercel.app/privacy" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-700 underline transition-colors"
                      >
                        Privacy Policy
                      </a>
                    </label>
                  </motion.div>

                  {/* Email Notifications */}
                  <motion.div 
                    className="flex items-start space-x-3"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <input
                      type="checkbox"
                      id="emailNotifications"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="emailNotifications" className="text-sm text-gray-600 leading-5">
                      I would like to receive email updates about job matches, resume enhancements, and other helpful notifications from RoleFitAI
                    </label>
                  </motion.div>
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || (isSignUp && !acceptTerms)}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </div>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </motion.button>
            </motion.form>

            {/* Toggle Auth Mode */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center mt-6"
            >
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-gray-400 hover:text-purple-400 transition-colors font-medium"
              >
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <span className="text-purple-400 hover:text-purple-300 font-semibold">
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </span>
              </button>
            </motion.div>
            
            {/* Security Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex items-center justify-center gap-2 mt-6 text-xs text-gray-500"
            >
              <Shield className="w-3 h-3" />
              <span>Your data is encrypted and secure</span>
            </motion.div>
          </div>
        </motion.div>
        </motion.div>
      )}

      {/* Google Terms Modal */}
      {showGoogleTermsModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Complete Your Registration</h3>
              <p className="text-gray-400">Please accept our terms to continue with Google sign-in</p>
            </div>

            <div className="space-y-4">
              {/* Terms Acceptance */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="googleAcceptTerms"
                  checked={googleAcceptTerms}
                  onChange={(e) => setGoogleAcceptTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  required
                />
                <label htmlFor="googleAcceptTerms" className="text-sm text-gray-300 leading-5">
                  I agree to the{' '}
                  <a 
                    href="https://rolefitai.vercel.app/terms" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    Terms and Conditions
                  </a>{' '}
                  and{' '}
                  <a 
                    href="https://rolefitai.vercel.app/privacy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>

              {/* Email Notifications */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="googleEmailNotifications"
                  checked={googleEmailNotifications}
                  onChange={(e) => setGoogleEmailNotifications(e.target.checked)}
                  className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="googleEmailNotifications" className="text-sm text-gray-300 leading-5">
                  I would like to receive email updates about job matches, resume enhancements, and other helpful notifications
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleGoogleTermsAcceptance}
                disabled={loading || !googleAcceptTerms}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Completing...
                  </div>
                ) : (
                  'Continue'
                )}
              </button>
              <button
                onClick={() => {
                  setShowGoogleTermsModal(false);
                  setGoogleUser(null);
                  setGoogleAcceptTerms(false);
                  setGoogleEmailNotifications(true);
                }}
                className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
