import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { ResumeService } from '../lib/resume-service';

/**
 * Custom hook for resume management operations
 * Provides functions to save, delete, parse, and sync resume data
 */
export const useResumeService = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Save resume data
   */
  const saveResume = useCallback(async (userId, resumeData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ResumeService.saveResume(userId, resumeData, dispatch);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  /**
   * Delete resume data
   */
  const deleteResume = useCallback(async (userId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ResumeService.deleteResume(userId, dispatch);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  /**
   * Parse resume text
   */
  const parseResumeText = useCallback(async (resumeText) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ResumeService.parseResumeText(resumeText);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Sync resume state with MongoDB
   */
  const syncResumeState = useCallback(async (userId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ResumeService.syncResumeState(userId, dispatch);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  /**
   * Get resume data
   */
  const getResumeData = useCallback(async (userId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ResumeService.getResumeData(userId);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Operations
    saveResume,
    deleteResume,
    parseResumeText,
    syncResumeState,
    getResumeData,
    
    // State
    loading,
    error,
    clearError
  };
};

/**
 * Custom hook for resume API operations
 * Provides functions to interact with resume API endpoints
 */
export const useResumeAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get auth token from Firebase
   */
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

  /**
   * Save resume via API
   */
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

  /**
   * Delete resume via API
   */
  const deleteResumeAPI = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      
      const response = await fetch('/api/resume/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete resume');
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  /**
   * Get resume via API
   */
  const getResumeAPI = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      
      const response = await fetch('/api/resume/save', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to get resume');
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  /**
   * Sync resume via API
   */
  const syncResumeAPI = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      
      const response = await fetch('/api/resume/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync resume');
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  /**
   * Parse resume via API
   */
  const parseResumeAPI = useCallback(async (resumeText) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      
      const response = await fetch('/api/resume/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ resumeText })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to parse resume');
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // API Operations
    saveResumeAPI,
    deleteResumeAPI,
    getResumeAPI,
    syncResumeAPI,
    parseResumeAPI,
    
    // State
    loading,
    error,
    clearError
  };
};