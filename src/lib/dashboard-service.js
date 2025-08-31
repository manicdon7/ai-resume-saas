import { UserService } from '../../lib/user-service';
import { 
  setLoading, 
  setRefreshing, 
  setLastRefresh, 
  setError, 
  clearError,
  updateDataFreshness,
  setNetworkStatus,
  updateCacheStatus
} from '../store/slices/dashboardSlice';
import { 
  setUser, 
  setCredits, 
  setStats, 
  setRecentActivity 
} from '../store/slices/authSlice';
import { 
  setResumeData, 
  setSyncStatus 
} from '../store/slices/resumeSlice';

/**
 * Dashboard data service with real-time capabilities
 * Handles data fetching, caching, and auto-refresh functionality
 */
export class DashboardService {
  static refreshInterval = null;
  static cache = new Map();
  static cacheExpiry = 5 * 60 * 1000; // 5 minutes
  static retryAttempts = 3;
  static retryDelay = 1000; // 1 second

  /**
   * Get auth token from Firebase
   */
  static async getAuthToken() {
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      return await user.getIdToken();
    } catch (error) {
      throw new Error('Failed to get authentication token');
    }
  }

  /**
   * Fetch dashboard data with retry logic
   */
  static async fetchDashboardDataWithRetry(useCache = true, retryCount = 0) {
    try {
      // Check cache first if enabled
      if (useCache) {
        const cachedData = this.getCachedData('dashboard');
        if (cachedData) {
          return { ...cachedData, fromCache: true };
        }
      }

      const token = await this.getAuthToken();
      
      const response = await fetch('/api/user/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch dashboard data');
      }

      // Cache the successful response
      this.setCachedData('dashboard', data);

      return { ...data, fromCache: false };
    } catch (error) {
      // Retry logic for network errors
      if (retryCount < this.retryAttempts && this.isRetryableError(error)) {
        await this.delay(this.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
        return this.fetchDashboardDataWithRetry(useCache, retryCount + 1);
      }
      
      // If all retries failed, try to return cached data as fallback
      if (useCache) {
        const cachedData = this.getCachedData('dashboard');
        if (cachedData) {
          return { ...cachedData, fromCache: true, stale: true };
        }
      }
      
      throw error;
    }
  }

  /**
   * Main function to fetch and update dashboard data
   */
  static async fetchDashboardData(dispatch, options = {}) {
    const { 
      useCache = true, 
      isRefresh = false, 
      silent = false 
    } = options;

    try {
      // Set loading state
      if (!silent) {
        if (isRefresh) {
          dispatch(setRefreshing(true));
        } else {
          dispatch(setLoading(true));
        }
        dispatch(clearError());
      }

      // Update network status
      dispatch(setNetworkStatus(navigator.onLine ? 'online' : 'offline'));

      // Fetch data with retry logic
      const result = await this.fetchDashboardDataWithRetry(useCache);
      
      // Update Redux state with fetched data
      this.updateReduxState(dispatch, result);

      // Update cache status
      dispatch(updateCacheStatus({
        hasCache: true,
        cacheAge: result.fromCache ? this.getCacheAge('dashboard') : 0,
        lastCacheUpdate: result.fromCache ? this.getCacheTimestamp('dashboard') : new Date().toISOString()
      }));

      // Update data freshness timestamps
      const now = new Date().toISOString();
      dispatch(updateDataFreshness({ type: 'userStats', timestamp: now }));
      dispatch(updateDataFreshness({ type: 'recentActivity', timestamp: now }));
      dispatch(updateDataFreshness({ type: 'resumeData', timestamp: now }));

      // Update last refresh time
      dispatch(setLastRefresh(now));

      return result;
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      
      // Set error state
      dispatch(setError({
        message: error.message,
        timestamp: new Date().toISOString(),
        type: 'fetch_error'
      }));

      // Update network status if it's a network error
      if (this.isNetworkError(error)) {
        dispatch(setNetworkStatus('offline'));
      }

      throw error;
    } finally {
      // Clear loading states
      if (!silent) {
        dispatch(setLoading(false));
        dispatch(setRefreshing(false));
      }
    }
  }

  /**
   * Update Redux state with dashboard data
   */
  static updateReduxState(dispatch, data) {
    const { user, stats, recentActivity, resume } = data;

    // Update auth slice
    if (user) {
      dispatch(setUser(user));
      dispatch(setCredits(user.credits));
    }

    if (stats) {
      dispatch(setStats(stats));
    }

    if (recentActivity) {
      dispatch(setRecentActivity(recentActivity));
    }

    // Update resume slice
    if (resume) {
      if (resume.hasResume) {
        dispatch(setResumeData({
          resumeText: resume.resumeText || '',
          parsedData: resume.parsedData,
          fileName: resume.fileName || 'resume.txt',
          uploadedAt: resume.uploadedAt,
          lastModified: resume.lastModified
        }));
        dispatch(setSyncStatus('synced'));
      } else {
        dispatch(setResumeData({
          resumeText: '',
          parsedData: null,
          fileName: '',
          uploadedAt: null,
          lastModified: null
        }));
        dispatch(setSyncStatus('synced'));
      }
    }
  }

  /**
   * Start auto-refresh mechanism
   */
  static startAutoRefresh(dispatch, interval = 30000) {
    this.stopAutoRefresh(); // Clear any existing interval
    
    this.refreshInterval = setInterval(async () => {
      try {
        await this.fetchDashboardData(dispatch, { 
          useCache: true, 
          isRefresh: true, 
          silent: true 
        });
      } catch (error) {
        console.error('Auto-refresh error:', error);
        // Don't throw error for auto-refresh failures
      }
    }, interval);

    return this.refreshInterval;
  }

  /**
   * Stop auto-refresh mechanism
   */
  static stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Manual refresh function
   */
  static async refreshDashboard(dispatch) {
    return this.fetchDashboardData(dispatch, { 
      useCache: false, 
      isRefresh: true 
    });
  }

  /**
   * Cache management functions
   */
  static setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expires: Date.now() + this.cacheExpiry
    });
  }

  static getCachedData(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  static getCacheAge(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    return Date.now() - cached.timestamp;
  }

  static getCacheTimestamp(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    return new Date(cached.timestamp).toISOString();
  }

  static clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Utility functions
   */
  static isRetryableError(error) {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('HTTP 5')
    );
  }

  static isNetworkError(error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch') ||
      !navigator.onLine
    );
  }

  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get dashboard data synchronously from cache
   */
  static getCachedDashboardData() {
    return this.getCachedData('dashboard');
  }

  /**
   * Check if data is fresh (within acceptable age)
   */
  static isDataFresh(key, maxAge = 60000) { // 1 minute default
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    return (Date.now() - cached.timestamp) < maxAge;
  }

  /**
   * Preload dashboard data for better performance
   */
  static async preloadDashboardData(dispatch) {
    try {
      await this.fetchDashboardData(dispatch, { 
        useCache: true, 
        silent: true 
      });
    } catch (error) {
      console.error('Preload error:', error);
      // Don't throw error for preload failures
    }
  }

  /**
   * Initialize dashboard service
   */
  static initialize(dispatch, options = {}) {
    const { 
      autoRefresh = true, 
      refreshInterval = 30000,
      preload = true 
    } = options;

    // Preload data if requested
    if (preload) {
      this.preloadDashboardData(dispatch);
    }

    // Start auto-refresh if enabled
    if (autoRefresh) {
      this.startAutoRefresh(dispatch, refreshInterval);
    }

    // Listen for online/offline events
    window.addEventListener('online', () => {
      dispatch(setNetworkStatus('online'));
      // Refresh data when coming back online
      this.fetchDashboardData(dispatch, { 
        useCache: false, 
        isRefresh: true, 
        silent: true 
      });
    });

    window.addEventListener('offline', () => {
      dispatch(setNetworkStatus('offline'));
    });
  }

  /**
   * Cleanup dashboard service
   */
  static cleanup() {
    this.stopAutoRefresh();
    this.clearCache();
    
    // Remove event listeners
    window.removeEventListener('online', () => {});
    window.removeEventListener('offline', () => {});
  }
}