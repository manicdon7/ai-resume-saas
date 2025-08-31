/**
 * Feedback Hook
 * Provides comprehensive loading states, error handling, and user feedback
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import feedbackManager from '../lib/feedback-system';
import { useToast } from '../components/ToastNotification';

/**
 * Main feedback hook
 */
export const useFeedback = (componentId) => {
  const [loading, setLoadingState] = useState(false);
  const [error, setErrorState] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const toast = useToast();
  const componentIdRef = useRef(componentId || `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Set toast provider on feedback manager
  useEffect(() => {
    feedbackManager.setToastProvider(toast);
  }, [toast]);

  // Register component with feedback manager
  useEffect(() => {
    const id = componentIdRef.current;
    
    const unregister = feedbackManager.register(id, ({ type, state }) => {
      if (type === 'loading') {
        setLoadingState(state ? state.loading : false);
        setLoadingMessage(state ? state.message : 'Loading...');
      } else if (type === 'error') {
        setErrorState(state ? state.error : null);
      }
    });

    return unregister;
  }, []);

  // Set loading state
  const setLoading = useCallback((isLoading, message = 'Loading...') => {
    feedbackManager.setLoading(componentIdRef.current, isLoading, message);
  }, []);

  // Set error state
  const setError = useCallback((error, context = {}) => {
    feedbackManager.setError(componentIdRef.current, error, context);
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    feedbackManager.clearError(componentIdRef.current);
  }, []);

  // Clear loading state
  const clearLoading = useCallback(() => {
    feedbackManager.clearLoading(componentIdRef.current);
  }, []);

  // Execute operation with automatic feedback
  const executeWithFeedback = useCallback(async (operation, options = {}) => {
    return feedbackManager.executeWithFeedback(componentIdRef.current, operation, options);
  }, []);

  // Show success notification
  const showSuccess = useCallback((message, title = 'Success') => {
    toast.showSuccess(title, message);
  }, [toast]);

  // Show error notification
  const showError = useCallback((message, title = 'Error') => {
    toast.showError(title, message);
  }, [toast]);

  // Show warning notification
  const showWarning = useCallback((message, title = 'Warning') => {
    toast.showWarning(title, message);
  }, [toast]);

  // Show info notification
  const showInfo = useCallback((message, title = 'Info') => {
    toast.showInfo(title, message);
  }, [toast]);

  return {
    // State
    loading,
    error,
    loadingMessage,
    
    // Actions
    setLoading,
    setError,
    clearError,
    clearLoading,
    executeWithFeedback,
    
    // Notifications
    showSuccess,
    showError,
    showWarning,
    showInfo,
    
    // Utilities
    componentId: componentIdRef.current
  };
};

/**
 * Hook for API operations with automatic feedback
 */
export const useApiOperation = (componentId) => {
  const feedback = useFeedback(componentId);
  
  const executeApi = useCallback(async (apiCall, options = {}) => {
    const {
      loadingMessage = 'Loading...',
      successMessage,
      errorMessage,
      showSuccessToast = false,
      retryOnError = true
    } = options;

    return feedback.executeWithFeedback(apiCall, {
      loadingMessage,
      successMessage,
      errorMessage,
      showSuccessToast,
      retryOnError,
      showErrorToast: true
    });
  }, [feedback]);

  return {
    ...feedback,
    executeApi
  };
};

/**
 * Hook for form operations with validation feedback
 */
export const useFormFeedback = (componentId) => {
  const feedback = useFeedback(componentId);
  const [validationErrors, setValidationErrors] = useState({});

  const setFieldError = useCallback((field, error) => {
    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
  }, []);

  const clearFieldError = useCallback((field) => {
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllFieldErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  const validateField = useCallback((field, value, validator) => {
    try {
      const isValid = validator(value);
      if (isValid === true) {
        clearFieldError(field);
        return true;
      } else {
        setFieldError(field, isValid || 'Invalid input');
        return false;
      }
    } catch (error) {
      setFieldError(field, error.message);
      return false;
    }
  }, [setFieldError, clearFieldError]);

  const submitForm = useCallback(async (formData, submitFunction, options = {}) => {
    const {
      validate,
      loadingMessage = 'Submitting...',
      successMessage = 'Form submitted successfully',
      errorMessage = 'Failed to submit form'
    } = options;

    try {
      // Clear previous validation errors
      clearAllFieldErrors();
      
      // Run validation if provided
      if (validate) {
        const validationResult = validate(formData);
        if (validationResult !== true) {
          if (typeof validationResult === 'object') {
            setValidationErrors(validationResult);
          }
          feedback.showWarning('Please fix the validation errors');
          return false;
        }
      }

      // Submit form
      const result = await feedback.executeWithFeedback(
        () => submitFunction(formData),
        {
          loadingMessage,
          successMessage,
          errorMessage,
          showSuccessToast: true
        }
      );

      return result;
    } catch (error) {
      // Handle validation errors from server
      if (error.type === 'VALIDATION_ERROR' && error.context?.fieldErrors) {
        setValidationErrors(error.context.fieldErrors);
      }
      throw error;
    }
  }, [feedback, clearAllFieldErrors]);

  return {
    ...feedback,
    validationErrors,
    setFieldError,
    clearFieldError,
    clearAllFieldErrors,
    validateField,
    submitForm,
    hasValidationErrors: Object.keys(validationErrors).length > 0
  };
};

/**
 * Hook for batch operations with progress tracking
 */
export const useBatchOperation = (componentId) => {
  const feedback = useFeedback(componentId);
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('');

  const executeBatch = useCallback(async (operations, options = {}) => {
    const {
      successMessage = 'All operations completed successfully',
      errorMessage = 'Some operations failed',
      operationNames = []
    } = options;

    setProgress(0);
    
    const results = await feedbackManager.executeBatch(
      feedback.componentId,
      operations,
      {
        progressCallback: (progressPercent, current, total) => {
          setProgress(progressPercent);
          const operationName = operationNames[current - 1] || `Operation ${current}`;
          setCurrentOperation(`${operationName} (${current}/${total})`);
        },
        successMessage,
        errorMessage
      }
    );

    setProgress(100);
    setCurrentOperation('');
    
    return results;
  }, [feedback]);

  return {
    ...feedback,
    progress,
    currentOperation,
    executeBatch
  };
};

/**
 * Hook for real-time data with automatic refresh and error recovery
 */
export const useRealTimeData = (fetchFunction, options = {}) => {
  const {
    refreshInterval = 30000,
    retryOnError = true,
    maxRetries = 3,
    componentId
  } = options;
  
  const feedback = useFeedback(componentId);
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        feedback.setLoading(true, 'Fetching latest data...');
      }

      const result = await fetchFunction();
      setData(result);
      setLastUpdated(new Date());
      feedback.clearError();
      
      return result;
    } catch (error) {
      if (retryOnError) {
        // Attempt recovery
        try {
          const result = await attemptRecovery(error, fetchFunction, { maxRetries });
          setData(result);
          setLastUpdated(new Date());
          feedback.clearError();
          return result;
        } catch (recoveryError) {
          feedback.setError(recoveryError, { retryCallback: () => fetchData(false) });
          throw recoveryError;
        }
      } else {
        feedback.setError(error, { retryCallback: () => fetchData(false) });
        throw error;
      }
    } finally {
      feedback.clearLoading();
    }
  }, [fetchFunction, feedback, retryOnError, maxRetries]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up auto-refresh
  useEffect(() => {
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchData(false); // Don't show loading for auto-refresh
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [fetchData, refreshInterval]);

  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  return {
    ...feedback,
    data,
    lastUpdated,
    refresh,
    isStale: lastUpdated && (Date.now() - lastUpdated.getTime()) > refreshInterval * 2
  };
};

export default useFeedback;