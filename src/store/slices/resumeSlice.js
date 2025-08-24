import { createSlice } from '@reduxjs/toolkit';

const initialState = {
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
  lastModified: null
};

const resumeSlice = createSlice({
  name: 'resume',
  initialState,
  reducers: {
    setResumeText: (state, action) => {
      state.resumeText = action.payload;
      state.lastModified = new Date().toISOString();
    },
    setResumeFile: (state, action) => {
      state.resumeFile = action.payload;
      state.uploadedAt = new Date().toISOString();
    },
    setParsedData: (state, action) => {
      state.parsedData = { ...state.parsedData, ...action.payload };
      state.lastModified = new Date().toISOString();
    },
    setAnalysisData: (state, action) => {
      state.analysisData = action.payload;
    },
    clearResume: (state) => {
      return initialState;
    },
    updatePersonalInfo: (state, action) => {
      state.parsedData = { ...state.parsedData, ...action.payload };
      state.lastModified = new Date().toISOString();
    }
  }
});

export const { 
  setResumeText, 
  setResumeFile, 
  setParsedData, 
  setAnalysisData, 
  clearResume, 
  updatePersonalInfo 
} = resumeSlice.actions;
export default resumeSlice.reducer;
