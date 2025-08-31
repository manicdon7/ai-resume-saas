import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DashboardService } from '../lib/dashboard-service';
import { 
  setAutoRefreshEnabled, 
  setRefreshInterval 
} from '../store/slices/dashboardSlice';

/**
 * Custom hook for dashboard data management with real-time capabilities
 */
export const useDashboardService = (options = {}) => {
  const dispatch = useDispatch();
  const dashboardState = useSelector(state => state.dashboard);
  const authState = useSelector(state => state.auth);
  const resumeState = useSelector(state => state.resume);
  
  const {
    autoRefresh = true,
    refreshInterval = 30000,
    preload = true
  } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const initializeRef = useRef(false);

  /**
   * Initialize dashboard service
   */
  const initialize = useCallback(() => {
    if (initializeRef.current) return;
    
    initializeRef.current = true;
    DashboardService.initialize(dispatch, {
      autoRefresh,
      refreshInterval,
      preload
    });
    setIsInitialized(true);
  }, [dispatch, autoRefresh, refreshInterval, preload]);

  /**
   * Fetch dashboard data
   */
  const fetchData = useCallback(async (options = {}) => {
    try {
      return await DashboardService.fetchDashboardData(dispatch, options);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      throw error;
    }
  }, [dispatch]);

  /**
   * Refresh dashboard data manually
   */
  const refresh = useCallback(async () => {
    try {
      return await DashboardService.refreshDashboard(dispatch);
    } catch (error) {
      console.error('Dashboard refresh error:', error);
      throw error;
    }
  }, [dispatch]);

  /**
   * Start auto-refresh
   */
  const startAutoRefresh = useCallback((interval = refreshInterval) => {
    DashboardService.startAutoRefresh(dispatch, interval);
    dispatch(setAutoRefreshEnabled(true));
    dispatch(setRefreshInterval(interval));
  }, [dispatch, refreshInterval]);

  /**
   * Stop auto-refresh
   */
  const stopAutoRefresh = useCallback(() => {
    DashboardService.stopAutoRefresh();
    dispatch(setAutoRefreshEnabled(false));
  }, [dispatch]);

  /**
   * Toggle auto-refresh
   */
  const toggleAutoRefresh = useCallback(() => {
    if (dashboardState.autoRefreshEnabled) {
      stopAutoRefresh();
    } else {
      startAutoRefresh();
    }
  }, [dashboardState.autoRefreshEnabled, startAutoRefresh, stopAutoRefresh]);

  /**
   * Update refresh interval
   */
  const updateRefreshInterval = useCallback((newInterval) => {
    dispatch(setRefreshInterval(newInterval));
    if (dashboardState.autoRefreshEnabled) {
      DashboardService.stopAutoRefresh();
      DashboardService.startAutoRefresh(dispatch, newInterval);
    }
  }, [dispatch, dashboardState.autoRefreshEnabled]);

  /**
   * Get cached data
   */
  const getCachedData = useCallback(() => {
    return DashboardService.getCachedDashboardData();
  }, []);

  /**
   * Clear cache
   */
  const clearCache = useCallback(() => {
    DashboardService.clearCache();
  }, []);

  /**
   * Check if data is fresh
   */
  const isDataFresh = useCallback((maxAge = 60000) => {
    return DashboardService.isDataFresh('dashboard', maxAge);
  }, []);

  /**
   * Preload data
   */
  const preloadData = useCallback(async () => {
    try {
      await DashboardService.preloadDashboardData(dispatch);
    } catch (error) {
      console.error('Preload error:', error);
    }
  }, [dispatch]);

  // Initialize on mount
  useEffect(() => {
    initialize();
    
    // Cleanup on unmount
    return () => {
      DashboardService.cleanup();
    };
  }, [initialize]);

  // Auto-refresh management
  useEffect(() => {
    if (isInitialized && dashboardState.autoRefreshEnabled) {
      startAutoRefresh(dashboardState.refreshInterval);
    } else if (isInitialized && !dashboardState.autoRefreshEnabled) {
      stopAutoRefresh();
    }
  }, [
    isInitialized, 
    dashboardState.autoRefreshEnabled, 
    dashboardState.refreshInterval,
    startAutoRefresh,
    stopAutoRefresh
  ]);

  return {
    // State
    isLoading: dashboardState.isLoading,
    isRefreshing: dashboardState.isRefreshing,
    error: dashboardState.error,
    lastRefresh: dashboardState.lastRefresh,
    autoRefreshEnabled: dashboardState.autoRefreshEnabled,
    refreshInterval: dashboardState.refreshInterval,
    refreshCount: dashboardState.refreshCount,
    networkStatus: dashboardState.networkStatus,
    cacheStatus: dashboardState.cacheStatus,
    dataFreshness: dashboardState.dataFreshness,
    
    // Data
    user: authState.user,
    stats: authState.stats,
    recentActivity: authState.recentActivity,
    credits: authState.credits,
    resume: resumeState,
    
    // Actions
    fetchData,
    refresh,
    startAutoRefresh,
    stopAutoRefresh,
    toggleAutoRefresh,
    updateRefreshInterval,
    getCachedData,
    clearCache,
    isDataFresh,
    preloadData,
    
    // Status
    isInitialized
  };
};

/**
 * Hook for dashboard statistics only
 */
export const useDashboardStats = () => {
  const authState = useSelector(state => state.auth);
  const dashboardState = useSelector(state => state.dashboard);
  
  return {
    stats: authState.stats,
    credits: authState.credits,
    isLoading: dashboardState.isLoading,
    error: dashboardState.error,
    lastRefresh: dashboardState.lastRefresh
  };
};

/**
 * Hook for recent activity only
 */
export const useDashboardActivity = () => {
  const authState = useSelector(state => state.auth);
  const dashboardState = useSelector(state => state.dashboard);
  
  return {
    recentActivity: authState.recentActivity || [],
    isLoading: dashboardState.isLoading,
    error: dashboardState.error,
    lastRefresh: dashboardState.lastRefresh
  };
};

/**
 * Hook for auto-refresh controls
 */
export const useAutoRefresh = () => {
  const dispatch = useDispatch();
  const dashboardState = useSelector(state => state.dashboard);
  
  const toggle = useCallback(() => {
    if (dashboardState.autoRefreshEnabled) {
      DashboardService.stopAutoRefresh();
      dispatch(setAutoRefreshEnabled(false));
    } else {
      DashboardService.startAutoRefresh(dispatch, dashboardState.refreshInterval);
      dispatch(setAutoRefreshEnabled(true));
    }
  }, [dispatch, dashboardState.autoRefreshEnabled, dashboardState.refreshInterval]);
  
  const updateInterval = useCallback((interval) => {
    dispatch(setRefreshInterval(interval));
    if (dashboardState.autoRefreshEnabled) {
      DashboardService.stopAutoRefresh();
      DashboardService.startAutoRefresh(dispatch, interval);
    }
  }, [dispatch, dashboardState.autoRefreshEnabled]);
  
  return {
    enabled: dashboardState.autoRefreshEnabled,
    interval: dashboardState.refreshInterval,
    toggle,
    updateInterval
  };
};