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
  lastModified: null,
  syncStatus: 'synced', // 'synced' | 'pending' | 'error'
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
};

const resumeSlice = createSlice({
  name: 'resume',
  initialState,
  reducers: {
    setResumeText: (state, action) => {
      state.resumeText = action.payload;
      state.lastModified = new Date().toISOString();
      state.syncStatus = 'pending';
      // Update word count
      state.metadata.wordCount = action.payload.split(/\s+/).filter(word => word.length > 0).length;
    },
    setResumeFile: (state, action) => {
      const file = action.payload;
      state.resumeFile = file;
      state.uploadedAt = new Date().toISOString();
      if (file) {
        state.fileName = file.name;
        state.fileSize = file.size;
        state.fileType = file.type;
      }
    },
    setParsedData: (state, action) => {
      state.parsedData = { ...state.parsedData, ...action.payload };
      state.lastModified = new Date().toISOString();
      state.syncStatus = 'pending';
      state.metadata.lastParsed = new Date().toISOString();
    },
    setAnalysisData: (state, action) => {
      state.analysisData = action.payload;
    },
    setUploadState: (state, action) => {
      const { isUploading, progress = 0 } = action.payload;
      state.isUploading = isUploading;
      state.uploadProgress = progress;
    },
    setSyncStatus: (state, action) => {
      state.syncStatus = action.payload;
      if (action.payload === 'synced') {
        state.error = null;
      }
    },
    setFileMetadata: (state, action) => {
      const { fileName, fileSize, fileType } = action.payload;
      state.fileName = fileName;
      state.fileSize = fileSize;
      state.fileType = fileType;
    },
    updateMetadata: (state, action) => {
      state.metadata = { ...state.metadata, ...action.payload };
    },
    incrementVersion: (state) => {
      state.version += 1;
      state.lastModified = new Date().toISOString();
    },
    setError: (state, action) => {
      state.error = action.payload;
      if (action.payload) {
        state.syncStatus = 'error';
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    clearResume: (state) => {
      return initialState;
    },
    updatePersonalInfo: (state, action) => {
      state.parsedData = { ...state.parsedData, ...action.payload };
      state.lastModified = new Date().toISOString();
      state.syncStatus = 'pending';
    },
    resetUploadState: (state) => {
      state.isUploading = false;
      state.uploadProgress = 0;
    }
  }
});

export const { 
  setResumeText, 
  setResumeFile, 
  setParsedData, 
  setAnalysisData, 
  setUploadState,
  setSyncStatus,
  setFileMetadata,
  updateMetadata,
  incrementVersion,
  setError,
  clearError,
  clearResume, 
  updatePersonalInfo,
  resetUploadState
} = resumeSlice.actions;
export default resumeSlice.reducer;
