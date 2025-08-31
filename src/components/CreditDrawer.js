'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Zap, 
  Crown, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  Sparkles,
  Star,
  Gift,
  RefreshCw
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { setCredits } from '@/store/slices/authSlice';
import { showToast } from '@/lib/toast-config';
import CreditDisplay from './CreditDisplay';
import CreditUsageIndicator from './CreditUsageIndicator';
import CreditHistory from './CreditHistory';
import Link from 'next/link';

const CreditDrawer = ({ isOpen, onClose }) => {
  const { user, credits, isPro } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);

  const refreshCredits = async () => {
    if (!user || refreshing) return;

    setRefreshing(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/user/credits', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        dispatch(setCredits(data.credits));
        showToast.success('Credits refreshed!');
      } else {
        showToast.error('Failed to refresh credits');
      }
    } catch (error) {
      console.error('Error refreshing credits:', error);
      showToast.error('Error refreshing credits');
    } finally {
      setRefreshing(false);
    }
  };

  const drawerVariants = {
    hidden: { x: '100%' },
    visible: { 
      x: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      x: '100%',
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed top-0 right-0 h-full w-full max-w-md bg-gradient-to-br from-gray-900 via-black to-gray-900 border-l border-white/10 shadow-2xl z-[9999] overflow-y-auto"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-1/4 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 p-6 h-full flex flex-col">
              {/* Header */}
              <motion.div 
                className="flex items-center justify-between mb-8"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Zap className="w-5 h-5 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold">
                    <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                      Credit Center
                    </span>
                  </h2>
                </div>
                
                <motion.button
                  onClick={onClose}
                  className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  data-cursor="pointer"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </motion.button>
              </motion.div>

              {/* Current Credits */}
              <motion.div
                className="mb-8"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.1 }}
              >
                <div className="relative overflow-hidden rounded-3xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 blur-xl" />
                  <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Current Balance</h3>
                      <motion.button
                        onClick={refreshCredits}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-300 text-sm text-gray-300 hover:text-white disabled:opacity-50"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        data-cursor="pointer"
                      >
                        <motion.div
                          animate={{ rotate: refreshing ? 360 : 0 }}
                          transition={{ duration: 1, repeat: refreshing ? Infinity : 0, ease: "linear" }}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </motion.div>
                        Refresh
                      </motion.button>
                    </div>
                    
                    <CreditDisplay 
                      showDetails={true}
                      size="large"
                      className="bg-transparent border-none p-0 mb-4"
                    />
                    
                    {!isPro && (
                      <CreditUsageIndicator 
                        showLabel={true}
                        showPercentage={true}
                        size="medium"
                      />
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Pro Status */}
              {isPro ? (
                <motion.div
                  className="mb-8"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.2 }}
                >
                  <div className="relative overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 blur-xl" />
                    <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Crown className="w-6 h-6 text-yellow-400" />
                        <h3 className="text-lg font-bold text-yellow-400">PRO MEMBER</h3>
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                      </div>
                      <p className="text-gray-300 text-sm mb-4">
                        Enjoy unlimited credits and premium features
                      </p>
                      <div className="flex items-center gap-2 text-sm text-yellow-400">
                        <Star className="w-4 h-4" />
                        <span>Premium benefits active</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  className="mb-8"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.2 }}
                >
                  <div className="relative overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 blur-xl" />
                    <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Gift className="w-6 h-6 text-purple-400" />
                        <h3 className="text-lg font-semibold text-white">Upgrade to PRO</h3>
                      </div>
                      <p className="text-gray-300 text-sm mb-4">
                        Get unlimited credits and access to all premium features
                      </p>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Link
                          href="/pricing"
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-500 hover:to-blue-500 transition-all duration-300 font-semibold"
                          data-cursor="pointer"
                          onClick={onClose}
                        >
                          <Crown className="w-4 h-4" />
                          Upgrade Now
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Credit Stats */}
              <motion.div
                className="mb-8"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Usage Statistics
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative overflow-hidden rounded-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 blur-sm" />
                    <div className="relative backdrop-blur-sm bg-white/5 border border-white/10 p-4 text-center">
                      <div className="text-2xl font-bold text-green-400 mb-1">
                        {isPro ? '∞' : Math.max(0, 10 - (10 - credits))}
                      </div>
                      <div className="text-xs text-gray-400">Used Today</div>
                    </div>
                  </div>
                  
                  <div className="relative overflow-hidden rounded-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 blur-sm" />
                    <div className="relative backdrop-blur-sm bg-white/5 border border-white/10 p-4 text-center">
                      <div className="text-2xl font-bold text-blue-400 mb-1">24h</div>
                      <div className="text-xs text-gray-400">Reset Time</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Credit History */}
              <motion.div
                className="flex-1"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  Recent Activity
                </h3>
                
                <div className="relative overflow-hidden rounded-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 blur-xl" />
                  <div className="relative">
                    <CreditHistory 
                      className="backdrop-blur-xl bg-white/5 border-white/10 rounded-2xl"
                      maxHeight="300px"
                      compact={true}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Footer */}
              <motion.div
                className="mt-6 pt-6 border-t border-white/10"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Credits reset daily at midnight UTC</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreditDrawer;