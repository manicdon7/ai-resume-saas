import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLoading: false,
  lastRefresh: null,
  autoRefreshEnabled: true,
  refreshInterval: 30000, // 30 seconds
  error: null,
  refreshCount: 0,
  isRefreshing: false,
  dataFreshness: {
    userStats: null,
    recentActivity: null,
    resumeData: null
  },
  networkStatus: 'online', // 'online' | 'offline' | 'slow'
  cacheStatus: {
    hasCache: false,
    cacheAge: null,
    lastCacheUpdate: null
  }
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setRefreshing: (state, action) => {
      state.isRefreshing = action.payload;
      if (action.payload) {
        state.refreshCount += 1;
      }
    },
    setLastRefresh: (state, action) => {
      state.lastRefresh = action.payload || new Date().toISOString();
      state.isRefreshing = false;
    },
    setAutoRefreshEnabled: (state, action) => {
      state.autoRefreshEnabled = action.payload;
    },
    setRefreshInterval: (state, action) => {
      state.refreshInterval = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
      state.isRefreshing = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateDataFreshness: (state, action) => {
      const { type, timestamp } = action.payload;
      state.dataFreshness[type] = timestamp || new Date().toISOString();
    },
    setNetworkStatus: (state, action) => {
      state.networkStatus = action.payload;
    },
    updateCacheStatus: (state, action) => {
      state.cacheStatus = { ...state.cacheStatus, ...action.payload };
    },
    incrementRefreshCount: (state) => {
      state.refreshCount += 1;
    },
    resetDashboard: (state) => {
      return {
        ...initialState,
        autoRefreshEnabled: state.autoRefreshEnabled,
        refreshInterval: state.refreshInterval
      };
    },
    clearDashboard: (state) => {
      return initialState;
    }
  }
});

export const {
  setLoading,
  setRefreshing,
  setLastRefresh,
  setAutoRefreshEnabled,
  setRefreshInterval,
  setError,
  clearError,
  updateDataFreshness,
  setNetworkStatus,
  updateCacheStatus,
  incrementRefreshCount,
  resetDashboard,
  clearDashboard
} = dashboardSlice.actions;

export default dashboardSlice.reducer;