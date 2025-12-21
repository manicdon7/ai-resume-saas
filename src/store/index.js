import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import resumeSlice from './slices/resumeSlice';
import jobsSlice from './slices/jobsSlice';
import uiSlice from './slices/uiSlice';
import dashboardSlice from './slices/dashboardSlice';

// Enhanced persist configuration
const persistConfig = {
  key: 'rolefit-ai-v1',
  storage,
  whitelist: ['auth', 'resume', 'jobs', 'dashboard'],
  blacklist: ['ui'], // Don't persist UI state
  version: 1,
  migrate: (state) => {
    // Handle state migrations between versions
    if (state && state._persist && state._persist.version !== 1) {
      // Migration logic for future versions
      console.log('Migrating Redux state to version 1');
    }
    return Promise.resolve(state);
  }
};

// Enhanced error handling middleware
const errorHandlingMiddleware = (store) => (next) => (action) => {
  try {
    return next(action);
  } catch (error) {
    console.error('Redux action error:', {
      action: action.type,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    // Dispatch error to UI slice for user notification
    store.dispatch({
      type: 'ui/addNotification',
      payload: {
        type: 'error',
        message: 'An error occurred. Please try again.',
        timestamp: Date.now()
      }
    });
    
    throw error;
  }
};

// Performance monitoring middleware
const performanceMiddleware = (store) => (next) => (action) => {
  const start = performance.now();
  const result = next(action);
  const end = performance.now();
  
  // Log slow actions in development
  if (process.env.NODE_ENV === 'development' && (end - start) > 100) {
    console.warn(`Slow Redux action: ${action.type} took ${(end - start).toFixed(2)}ms`);
  }
  
  return result;
};

// Create a root reducer that handles global actions
const appReducer = combineReducers({
  auth: authSlice,
  resume: resumeSlice,
  jobs: jobsSlice,
  ui: uiSlice,
  dashboard: dashboardSlice
});

// Root reducer that handles signout action
const rootReducer = (state, action) => {
  // Clear all state on signout
  if (action.type === 'auth/signOut' || action.type === 'SIGNOUT_SUCCESS') {
    // Reset all slices to their initial state
    state = {
      auth: {
        user: null,
        isAuthenticated: false,
        isPro: false,
        credits: 0,
        loading: false,
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
      },
      resume: {
        resumeText: '',
        resumeFile: null,
        parsedData: {
          name: '',
          email: '',
          phone: '',
          location: '',
          summary: '',
          experience: [],
          education: [],
          skills: [],
          certifications: []
        },
        analysisData: null,
        uploadedAt: null,
        lastModified: null,
        syncStatus: 'synced',
        isUploading: false,
        uploadProgress: 0,
        fileName: '',
        fileSize: 0,
        fileType: '',
        version: 1,
        error: null,
        metadata: {
          wordCount: 0,
          pageCount: 0,
          lastParsed: null,
          parseVersion: null
        }
      },
      jobs: {
        recommendedJobs: [],
        savedJobs: [],
        appliedJobs: [],
        searchFilters: {
          location: '',
          jobType: '',
          salaryRange: '',
          experience: ''
        },
        loading: false,
        lastFetched: null
      },
      ui: {
        sidebarOpen: false,
        currentPage: 'dashboard',
        notifications: [],
        theme: 'light',
        loading: {
          global: false,
          upload: false,
          analysis: false,
          jobs: false
        }
      },
      dashboard: {
        isLoading: false,
        lastRefresh: null,
        autoRefreshEnabled: true,
        refreshInterval: 30000,
        error: null,
        refreshCount: 0,
        isRefreshing: false,
        dataFreshness: {
          userStats: null,
          recentActivity: null,
          resumeData: null
        },
        networkStatus: 'online',
        cacheStatus: {
          hasCache: false,
          cacheAge: null,
          lastCacheUpdate: null
        }
      }
    };
  }
  
  return appReducer(state, action);
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST', 
          'persist/REHYDRATE', 
          'persist/FLUSH', 
          'persist/PAUSE', 
          'persist/PURGE', 
          'persist/REGISTER',
          'auth/setUser',
          'auth/addActivity',
          'resume/setResumeFile',
          'SIGNOUT_SUCCESS'
        ],
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp', 'payload', 'payload.resumeFile'],
        ignoredPaths: ['items.dates', 'resume.resumeFile'],
      },
      immutableCheck: {
        warnAfter: 128, // Warn if immutability check takes longer than 128ms
      },
      thunk: {
        extraArgument: {
          // Add extra services that can be accessed in thunks
          api: '/api',
          storage: storage
        }
      }
    })
    .concat(errorHandlingMiddleware)
    .concat(performanceMiddleware),
  devTools: process.env.NODE_ENV === 'development' && {
    name: 'RoleFit AI',
    trace: true,
    traceLimit: 25
  }
});

export const persistor = persistStore(store, {
  manualPersist: false
});

// Enhanced store utilities
export const getStoreState = () => store.getState();

export const isStoreRehydrated = () => {
  const state = store.getState();
  return state._persist && state._persist.rehydrated;
};

// Wait for store rehydration
export const waitForRehydration = () => {
  return new Promise((resolve) => {
    const unsubscribe = store.subscribe(() => {
      if (isStoreRehydrated()) {
        unsubscribe();
        resolve(store.getState());
      }
    });
    
    // If already rehydrated, resolve immediately
    if (isStoreRehydrated()) {
      unsubscribe();
      resolve(store.getState());
    }
  });
};

// Enhanced signout with cleanup
export const signOutAllSlices = () => {
  return async (dispatch) => {
    try {
      // Clear any pending API requests
      if (typeof window !== 'undefined' && window.AbortController) {
        // Signal to abort any ongoing requests
        window.dispatchEvent(new CustomEvent('user-signout'));
      }
      
      // Dispatch signout to all slices
      dispatch({ type: 'auth/signOut' });
      dispatch({ type: 'resume/clearResume' });
      dispatch({ type: 'jobs/signOut' });
      dispatch({ type: 'ui/signOut' });
      dispatch({ type: 'dashboard/clearDashboard' });
      
      // Clear persisted state
      await persistor.purge();
      
      // Clear localStorage items that aren't handled by redux-persist
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user-preferences');
      }
      
      console.log('✅ User signed out and state cleared');
    } catch (error) {
      console.error('Error during signout:', error);
      // Still try to clear what we can
      await persistor.purge();
    }
  };
};

// Store health check
export const checkStoreHealth = () => {
  const state = store.getState();
  const health = {
    isRehydrated: isStoreRehydrated(),
    hasUser: !!state.auth?.user,
    hasResume: !!state.resume?.resumeText,
    lastActivity: state.auth?.stats?.lastActivityAt,
    storeSize: JSON.stringify(state).length,
    timestamp: new Date().toISOString()
  };
  
  console.log('Store Health Check:', health);
  return health;
};
