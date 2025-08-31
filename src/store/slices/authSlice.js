import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  isAuthenticated: false,
  isPro: false,
  credits: 0,
  loading: true,
  stats: {
    creditsRemaining: 0,
    resumesCreated: 0,
    applicationsSent: 0,
    jobSearches: 0,
    totalActivities: 0,
    lastActivityAt: null
  },
  recentActivity: [],
  creditTransactions: [],
  creditHistory: {
    transactions: [],
    loading: false,
    error: null
  },
  lastUpdated: null,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      // Only store serializable user data
      const user = action.payload;
      if (user) {
        state.user = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          acceptedTerms: user.acceptedTerms || false,
          isNotificationOn: user.isNotificationOn || true,
          emailPreferences: user.emailPreferences || {},
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLoginAt: user.lastLoginAt
        };
        state.isAuthenticated = true;
      } else {
        state.user = null;
        state.isAuthenticated = false;
      }
      state.loading = false;
      state.lastUpdated = new Date().toISOString();
    },
    setProStatus: (state, action) => {
      state.isPro = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    setCredits: (state, action) => {
      state.credits = action.payload;
      state.stats.creditsRemaining = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    setStats: (state, action) => {
      state.stats = { ...state.stats, ...action.payload };
      state.lastUpdated = new Date().toISOString();
    },
    updateStats: (state, action) => {
      const { type, increment = 1 } = action.payload;
      switch (type) {
        case 'resume_created':
          state.stats.resumesCreated += increment;
          break;
        case 'application_sent':
          state.stats.applicationsSent += increment;
          break;
        case 'job_search':
          state.stats.jobSearches += increment;
          break;
        case 'activity':
          state.stats.totalActivities += increment;
          state.stats.lastActivityAt = new Date().toISOString();
          break;
        default:
          break;
      }
      state.lastUpdated = new Date().toISOString();
    },
    setRecentActivity: (state, action) => {
      state.recentActivity = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    addActivity: (state, action) => {
      const activity = {
        ...action.payload,
        timestamp: new Date().toISOString()
      };
      state.recentActivity.unshift(activity);
      // Keep only the 10 most recent activities
      if (state.recentActivity.length > 10) {
        state.recentActivity = state.recentActivity.slice(0, 10);
      }
      state.stats.totalActivities += 1;
      state.stats.lastActivityAt = activity.timestamp;
      state.lastUpdated = new Date().toISOString();
    },
    updateUserProfile: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        state.lastUpdated = new Date().toISOString();
      }
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    signOut: (state) => {
      return {
        ...initialState,
        loading: false
      };
    },
    clearAllData: (state) => {
      return initialState;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    // Credit transaction management
    addCreditTransaction: (state, action) => {
      const transaction = {
        ...action.payload,
        timestamp: action.payload.timestamp || new Date().toISOString()
      };
      state.creditTransactions.unshift(transaction);
      // Keep only the 20 most recent transactions
      if (state.creditTransactions.length > 20) {
        state.creditTransactions = state.creditTransactions.slice(0, 20);
      }
      state.lastUpdated = new Date().toISOString();
    },
    setCreditHistory: (state, action) => {
      if (!state.creditHistory) {
        state.creditHistory = { transactions: [], loading: false, error: null };
      }
      state.creditHistory.transactions = action.payload;
      state.creditHistory.loading = false;
      state.creditHistory.error = null;
      state.lastUpdated = new Date().toISOString();
    },
    setCreditHistoryLoading: (state, action) => {
      if (!state.creditHistory) {
        state.creditHistory = { transactions: [], loading: false, error: null };
      }
      state.creditHistory.loading = action.payload;
    },
    setCreditHistoryError: (state, action) => {
      if (!state.creditHistory) {
        state.creditHistory = { transactions: [], loading: false, error: null };
      }
      state.creditHistory.error = action.payload;
      state.creditHistory.loading = false;
    },
    consumeCredit: (state, action) => {
      const { amount = 1, action: creditAction, transaction } = action.payload;
      
      if (!state.isPro && state.credits > 0) {
        state.credits = Math.max(0, state.credits - amount);
        state.stats.creditsRemaining = state.credits;
      }
      
      // Add transaction to history
      if (transaction) {
        state.creditTransactions.unshift(transaction);
        if (state.creditTransactions.length > 20) {
          state.creditTransactions = state.creditTransactions.slice(0, 20);
        }
      }
      
      state.lastUpdated = new Date().toISOString();
    },
    addCredits: (state, action) => {
      const { amount, transaction } = action.payload;
      
      if (!state.isPro) {
        state.credits += amount;
        state.stats.creditsRemaining = state.credits;
      }
      
      // Add transaction to history
      if (transaction) {
        state.creditTransactions.unshift(transaction);
        if (state.creditTransactions.length > 20) {
          state.creditTransactions = state.creditTransactions.slice(0, 20);
        }
      }
      
      state.lastUpdated = new Date().toISOString();
    },
    updateCreditBalance: (state, action) => {
      const { credits, isPro, transaction } = action.payload;
      
      state.credits = isPro ? 'unlimited' : credits;
      state.stats.creditsRemaining = state.credits;
      state.isPro = isPro;
      
      if (transaction) {
        state.creditTransactions.unshift(transaction);
        if (state.creditTransactions.length > 20) {
          state.creditTransactions = state.creditTransactions.slice(0, 20);
        }
      }
      
      state.lastUpdated = new Date().toISOString();
    }
  }
});

export const { 
  setUser, 
  setProStatus, 
  setCredits, 
  setStats,
  updateStats,
  setRecentActivity,
  addActivity,
  updateUserProfile,
  setError,
  clearError,
  signOut, 
  setLoading, 
  clearAllData,
  addCreditTransaction,
  setCreditHistory,
  setCreditHistoryLoading,
  setCreditHistoryError,
  consumeCredit,
  addCredits,
  updateCreditBalance
} = authSlice.actions;
export default authSlice.reducer;
