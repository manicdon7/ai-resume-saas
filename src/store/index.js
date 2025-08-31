import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import resumeSlice from './slices/resumeSlice';
import jobsSlice from './slices/jobsSlice';
import uiSlice from './slices/uiSlice';
import dashboardSlice from './slices/dashboardSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'resume', 'jobs', 'dashboard'] // Only persist these slices
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
    }),
});

export const persistor = persistStore(store);

// Utility function to dispatch signout across all slices
export const signOutAllSlices = () => {
  return (dispatch) => {
    // Dispatch signout to all slices that have it
    dispatch({ type: 'auth/signOut' });
    dispatch({ type: 'resume/clearResume' });
    dispatch({ type: 'jobs/signOut' });
    dispatch({ type: 'ui/signOut' });
    dispatch({ type: 'dashboard/clearDashboard' });
    
    // Clear persisted state
    persistor.purge();
  };
};
