import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ResumeService } from '../lib/resume-service';
import { CreditsService } from '../lib/credits-service';
import { 
  setResumeText, 
  setParsedData, 
  setFileMetadata, 
  updateMetadata,
  setSyncStatus,
  setError,
  clearError,
  clearResume
} from '../store/slices/resumeSlice';

/**
 * Enhanced Resume Service Hook
 * Manages resume data, credit consumption, and state synchronization
 */
export function useResumeService() {
  const dispatch = useDispatch();
  const resumeState = useSelector(state => state.resume);
  const authState = useSelector(state => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [creditInfo, setCreditInfo] = useState(null);

  // Get current user info
  const user = authState.user;
  const authToken = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;

  /**
   * Upload and process resume file with credit consumption
   */
  const uploadResume = useCallback(async (file) => {
    if (!user || !authToken) {
      throw new Error('User must be authenticated to upload resume');
    }

    setLoading(true);
    setUploadProgress(0);
    dispatch(clearError());

    try {
      // Check credits first
      const creditCheck = await CreditsService.validateActionCredits(
        `Bearer ${authToken}`, 
        CreditsService.CREDIT_ACTIONS.RESUME_UPLOAD
      );

      if (!creditCheck.success) {
        throw new Error(creditCheck.error);
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      setUploadProgress(25);

      // Upload and extract text (this will consume 1 credit)
      const extractResponse = await fetch('/api/extract-text', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      setUploadProgress(50);

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json();
        throw new Error(errorData.error?.message || 'Failed to extract text from file');
      }

      const extractData = await extractResponse.json();
      
      if (!extractData.success) {
        throw new Error(extractData.error?.message || 'Failed to extract text');
      }

      setUploadProgress(75);

      // Save resume data to state and database
      const resumeData = {
        resumeText: extractData.data.text,
        parsedData: extractData.data.parsedData,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      };

      // Update Redux state
      dispatch(setResumeText(resumeData.resumeText));
      dispatch(setParsedData(resumeData.parsedData));
      dispatch(setFileMetadata({
        fileName: resumeData.fileName,
        fileSize: resumeData.fileSize,
        fileType: resumeData.fileType
      }));
      dispatch(setSyncStatus('synced'));

      setUploadProgress(100);

      // Set credit info
      setCreditInfo({
        consumed: 1,
        remaining: creditCheck.isPro ? 'unlimited' : creditCheck.credits - 1,
        isPro: creditCheck.isPro
      });

      return {
        success: true,
        data: resumeData,
        creditInfo: {
          consumed: 1,
          remaining: creditCheck.isPro ? 'unlimited' : creditCheck.credits - 1
        }
      };

    } catch (error) {
      console.error('Resume upload error:', error);
      dispatch(setError(error.message));
      throw error;
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  }, [user, authToken, dispatch]);

  /**
   * Analyze resume with ATS check (consumes 1 credit)
   */
  const analyzeATS = useCallback(async (jobDescription) => {
    if (!user || !authToken) {
      throw new Error('User must be authenticated');
    }

    if (!resumeState.resumeText) {
      throw new Error('Please upload a resume first');
    }

    setLoading(true);
    dispatch(clearError());

    try {
      const response = await fetch('/api/analysis/ats-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          resumeText: resumeState.resumeText,
          jobDescription
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'ATS analysis failed');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'ATS analysis failed');
      }

      return data.data.analysis;

    } catch (error) {
      console.error('ATS analysis error:', error);
      dispatch(setError(error.message));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, authToken, resumeState.resumeText, dispatch]);

  /**
   * Analyze role fit (consumes 1 credit)
   */
  const analyzeRoleFit = useCallback(async (jobDescription) => {
    if (!user || !authToken) {
      throw new Error('User must be authenticated');
    }

    if (!resumeState.resumeText) {
      throw new Error('Please upload a resume first');
    }

    setLoading(true);
    dispatch(clearError());

    try {
      const response = await fetch('/api/analysis/role-fit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          resumeText: resumeState.resumeText,
          jobDescription
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Role fit analysis failed');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Role fit analysis failed');
      }

      return data.data.analysis;

    } catch (error) {
      console.error('Role fit analysis error:', error);
      dispatch(setError(error.message));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, authToken, resumeState.resumeText, dispatch]);

  /**
   * Generate enhanced resume (consumes 1 credit)
   */
  const enhanceResume = useCallback(async (jobDescription) => {
    if (!user || !authToken) {
      throw new Error('User must be authenticated');
    }

    if (!resumeState.resumeText) {
      throw new Error('Please upload a resume first');
    }

    setLoading(true);
    dispatch(clearError());

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          resumeText: resumeState.resumeText,
          jobDescription
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Resume enhancement failed');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Resume enhancement failed');
      }

      return data.data.text;

    } catch (error) {
      console.error('Resume enhancement error:', error);
      dispatch(setError(error.message));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, authToken, resumeState.resumeText, dispatch]);

  /**
   * Generate cover letter PDF (consumes 1 credit)
   */
  const generateCoverLetter = useCallback(async (jobDescription, name) => {
    if (!user || !authToken) {
      throw new Error('User must be authenticated');
    }

    if (!resumeState.resumeText) {
      throw new Error('Please upload a resume first');
    }

    setLoading(true);
    dispatch(clearError());

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          content: resumeState.resumeText,
          jobDescription,
          name: name || resumeState.parsedData?.name || 'Your Name'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Cover letter generation failed');
      }

      // Return blob for download
      const blob = await response.blob();
      return blob;

    } catch (error) {
      console.error('Cover letter generation error:', error);
      dispatch(setError(error.message));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, authToken, resumeState.resumeText, resumeState.parsedData, dispatch]);

  /**
   * Sync resume data from database
   */
  const syncResumeData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    dispatch(clearError());

    try {
      const resumeData = await ResumeService.syncResumeState(user.uid, dispatch);
      return resumeData;
    } catch (error) {
      console.error('Resume sync error:', error);
      dispatch(setError(error.message));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, dispatch]);

  /**
   * Clear resume data
   */
  const clearResumeData = useCallback(() => {
    dispatch(clearResume());
    setCreditInfo(null);
  }, [dispatch]);

  /**
   * Get resume completeness analysis
   */
  const getResumeAnalysis = useCallback(() => {
    if (!resumeState.parsedData) {
      return {
        isComplete: false,
        completenessScore: 0,
        suggestions: ['Upload a resume to get analysis']
      };
    }

    return {
      isComplete: ResumeService.isResumeComplete(resumeState.parsedData),
      completenessScore: ResumeService.calculateCompletenessScore(resumeState.parsedData),
      suggestions: ResumeService.generateImprovementSuggestions(resumeState.parsedData),
      skillsCount: resumeState.parsedData.skills?.length || 0,
      experienceYears: ResumeService.calculateExperienceYears(resumeState.parsedData.experience)
    };
  }, [resumeState.parsedData]);

  /**
   * Match resume with job description
   */
  const matchWithJob = useCallback((jobDescription) => {
    if (!resumeState.parsedData || !jobDescription) {
      return {
        matchScore: 0,
        matchedSkills: [],
        missingSkills: [],
        recommendations: ['Please provide both resume and job description']
      };
    }

    return ResumeService.analyzeJobMatch(
      { parsedData: resumeState.parsedData }, 
      jobDescription
    );
  }, [resumeState.parsedData]);

  // Auto-sync resume data on user login
  useEffect(() => {
    if (user && !resumeState.resumeText && resumeState.syncStatus !== 'pending') {
      syncResumeData().catch(console.error);
    }
  }, [user, resumeState.resumeText, resumeState.syncStatus, syncResumeData]);

  return {
    // State
    resumeState,
    loading,
    uploadProgress,
    creditInfo,
    
    // Actions
    uploadResume,
    analyzeATS,
    analyzeRoleFit,
    enhanceResume,
    generateCoverLetter,
    syncResumeData,
    clearResumeData,
    
    // Analysis
    getResumeAnalysis,
    matchWithJob,
    
    // Computed properties
    hasResume: !!resumeState.resumeText,
    isComplete: ResumeService.isResumeComplete(resumeState.parsedData),
    completenessScore: ResumeService.calculateCompletenessScore(resumeState.parsedData)
  };
}

/**
 * Legacy Resume Service Hook (for backward compatibility)
 */
export const useResumeAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAuthToken = useCallback(async () => {
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      return await user.getIdToken();
    } catch (err) {
      throw new Error('Failed to get authentication token');
    }
  }, []);

  const saveResumeAPI = useCallback(async (resumeData) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      
      const response = await fetch('/api/resume/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ resumeData })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save resume');
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    saveResumeAPI,
    loading,
    error,
    clearError
  };
};