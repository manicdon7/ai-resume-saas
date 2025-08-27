import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import resumeSlice from './slices/resumeSlice';
import jobsSlice from './slices/jobsSlice';
import uiSlice from './slices/uiSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'resume', 'jobs'] // Only persist these slices
};

const rootReducer = combineReducers({
  auth: authSlice,
  resume: resumeSlice,
  jobs: jobsSlice,
  ui: uiSlice
});

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
          'auth/setUser'
        ],
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp', 'payload'],
        ignoredPaths: ['items.dates'],
      },
    }),
});

export const persistor = persistStore(store);
