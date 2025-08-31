import { createSlice } from '@reduxjs/toolkit';

const initialState = {
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
};

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setRecommendedJobs: (state, action) => {
      state.recommendedJobs = action.payload;
      state.lastFetched = new Date().toISOString();
    },
    addSavedJob: (state, action) => {
      const jobExists = state.savedJobs.find(job => job.id === action.payload.id);
      if (!jobExists) {
        state.savedJobs.push(action.payload);
      }
    },
    removeSavedJob: (state, action) => {
      state.savedJobs = state.savedJobs.filter(job => job.id !== action.payload);
    },
    setSavedJobs: (state, action) => {
      state.savedJobs = action.payload;
    },
    setAppliedJobs: (state, action) => {
      state.appliedJobs = action.payload;
    },
    addAppliedJob: (state, action) => {
      const jobExists = state.appliedJobs.find(job => job.id === action.payload.id);
      if (!jobExists) {
        state.appliedJobs.push({
          ...action.payload,
          appliedAt: new Date().toISOString()
        });
      }
    },
    setSearchFilters: (state, action) => {
      state.searchFilters = { ...state.searchFilters, ...action.payload };
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    clearJobs: (state) => {
      return initialState;
    },
    signOut: (state) => {
      return initialState;
    }
  }
});

export const { 
  setRecommendedJobs, 
  addSavedJob, 
  removeSavedJob, 
  setSavedJobs,
  setAppliedJobs,
  addAppliedJob, 
  setSearchFilters, 
  setLoading, 
  clearJobs,
  signOut
} = jobsSlice.actions;
export default jobsSlice.reducer;
