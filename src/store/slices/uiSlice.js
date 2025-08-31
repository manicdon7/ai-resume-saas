import { createSlice } from '@reduxjs/toolkit';

const initialState = {
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
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload,
        timestamp: new Date().toISOString()
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setLoading: (state, action) => {
      const { key, value } = action.payload;
      state.loading[key] = value;
    },
    signOut: (state) => {
      // Reset UI state but keep theme preference
      return {
        ...initialState,
        theme: state.theme
      };
    },
    clearNotifications: (state) => {
      state.notifications = [];
    }
  }
});

export const { 
  setSidebarOpen, 
  setCurrentPage, 
  addNotification, 
  removeNotification, 
  setTheme, 
  setLoading,
  signOut,
  clearNotifications
} = uiSlice.actions;
export default uiSlice.reducer;
