/**
 * Comprehensive Feedback System
 * Integrates loading states, error handling, and user notifications
 */

import { handleError, ErrorTypes } from './error-handler';
import { attemptRecovery } from './error-recovery';

/**
 * Feedback Manager Class
 * Coordinates loading states, error handling, and user feedback
 */
class FeedbackManager {
  constructor() {
    this.loadingStates = new Map();
    this.errorStates = new Map();
    this.listeners = new Map();
    this.toastProvider = null;
  }

  /**
   * Set toast provider for notifications
   */
  setToastProvider(toastProvider) {
    this.toastProvider = toastProvider;
  }

  /**
   * Register a component for feedback updates
   */
  register(componentId, updateCallback) {
    this.listeners.set(componentId, updateCallback);
    
    // Return unregister function
    return () => {
      this.listeners.delete(componentId);
      this.loadingStates.delete(componentId);
      this.errorStates.delete(componentId);
    };
  }

  /**
   * Set loading state for a component
   */
  setLoading(componentId, loading, message = 'Loading...') {
    const state = {
      loading,
      message,
      timestamp: Date.now()
    };
    
    this.loadingStates.set(componentId, state);
    this.notifyComponent(componentId, 'loading', state);
  }

  /**
   * Set error state for a component
   */
  setError(componentId, error, context = {}) {
    const appError = handleError(error, context);
    const state = {
      error: appError,
      message: appError.message,
      timestamp: Date.now(),
      context
    };
    
    this.errorStates.set(componentId, state);
    this.notifyComponent(componentId, 'error', state);
    
    // Show toast notification for errors
    if (this.toastProvider) {
      this.showErrorToast(appError, context);
    }
  }

  /**
   * Clear error state for a component
   */
  clearError(componentId) {
    this.errorStates.delete(componentId);
    this.notifyComponent(componentId, 'error', null);
  }

  /**
   * Clear loading state for a component
   */
  clearLoading(componentId) {
    this.loadingStates.delete(componentId);
    this.notifyComponent(componentId, 'loading', null);
  }

  /**
   * Get current state for a component
   */
  getState(componentId) {
    return {
      loading: this.loadingStates.get(componentId) || null,
      error: this.errorStates.get(componentId) || null
    };
  }

  /**
   * Notify component of state changes
   */
  notifyComponent(componentId, type, state) {
    const callback = this.listeners.get(componentId);
    if (callback) {
      callback({ type, state });
    }
  }

  /**
   * Execute an async operation with automatic feedback
   */
  async executeWithFeedback(componentId, operation, options = {}) {
    const {
      loadingMessage = 'Loading...',
      successMessage,
      errorMessage,
      showSuccessToast = false,
      showErrorToast = true,
      retryOnError = false,
      maxRetries = 3
    } = options;

    try {
      // Set loading state
      this.setLoading(componentId, true, loadingMessage);
      
      // Execute operation
      let result;
      if (retryOnError) {
        result = await attemptRecovery(
          new Error('Operation failed'),
          operation,
          { maxRetries, componentId }
        );
      } else {
        result = await operation();
      }
      
      // Clear loading state
      this.clearLoading(componentId);
      
      // Show success feedback
      if (showSuccessToast && successMessage && this.toastProvider) {
        this.toastProvider.showSuccess('Success', successMessage);
      }
      
      return result;
    } catch (error) {
      // Clear loading state
      this.clearLoading(componentId);
      
      // Set error state
      this.setError(componentId, error, { 
        operation: operation.name || 'Unknown operation',
        showToast: showErrorToast,
        customMessage: errorMessage
      });
      
      throw error;
    }
  }

  /**
   * Show error toast notification
   */
  showErrorToast(appError, context = {}) {
    if (!this.toastProvider) return;

    const { customMessage, showToast = true } = context;
    
    if (!showToast) return;

    const message = customMessage || this.getErrorMessage(appError);
    const actions = this.getErrorActions(appError, context);

    this.toastProvider.showError('Error', message, {
      duration: appError.severity === 'critical' ? 0 : 7000,
      actions
    });
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(appError) {
    const messages = {
      [ErrorTypes.NETWORK]: 'Connection problem. Please check your internet connection.',
      [ErrorTypes.AUTHENTICATION]: 'Please sign in again to continue.',
      [ErrorTypes.PERMISSION]: 'You don\'t have permission to perform this action.',
      [ErrorTypes.NOT_FOUND]: 'The requested information could not be found.',
      [ErrorTypes.SERVER]: 'Server is temporarily unavailable. Please try again later.',
      [ErrorTypes.VALIDATION]: 'Please check your input and try again.',
      [ErrorTypes.CLIENT]: 'Something went wrong. Please try again.',
      [ErrorTypes.UNKNOWN]: 'An unexpected error occurred.'
    };

    return messages[appError.type] || messages[ErrorTypes.UNKNOWN];
  }

  /**
   * Get error-specific actions
   */
  getErrorActions(appError, context = {}) {
    const actions = [];

    // Add retry action for recoverable errors
    if ([ErrorTypes.NETWORK, ErrorTypes.SERVER].includes(appError.type)) {
      actions.push({
        label: 'Retry',
        onClick: () => {
          if (context.retryCallback) {
            context.retryCallback();
          } else {
            window.location.reload();
          }
        }
      });
    }

    // Add sign in action for auth errors
    if (appError.type === ErrorTypes.AUTHENTICATION) {
      actions.push({
        label: 'Sign In',
        onClick: () => {
          window.location.href = '/login';
        }
      });
    }

    // Add contact support action for critical errors
    if (appError.severity === 'critical') {
      actions.push({
        label: 'Contact Support',
        onClick: () => {
          window.location.href = '/contact';
        }
      });
    }

    return actions;
  }

  /**
   * Show success notification
   */
  showSuccess(message, title = 'Success') {
    if (this.toastProvider) {
      this.toastProvider.showSuccess(title, message);
    }
  }

  /**
   * Show info notification
   */
  showInfo(message, title = 'Info') {
    if (this.toastProvider) {
      this.toastProvider.showInfo(title, message);
    }
  }

  /**
   * Show warning notification
   */
  showWarning(message, title = 'Warning') {
    if (this.toastProvider) {
      this.toastProvider.showWarning(title, message);
    }
  }

  /**
   * Batch operations with progress tracking
   */
  async executeBatch(componentId, operations, options = {}) {
    const {
      progressCallback,
      successMessage = 'All operations completed successfully',
      errorMessage = 'Some operations failed'
    } = options;

    const results = [];
    const errors = [];
    
    this.setLoading(componentId, true, 'Processing...');

    for (let i = 0; i < operations.length; i++) {
      try {
        const progress = ((i + 1) / operations.length) * 100;
        
        if (progressCallback) {
          progressCallback(progress, i + 1, operations.length);
        }
        
        const result = await operations[i]();
        results.push(result);
      } catch (error) {
        errors.push({ index: i, error });
      }
    }

    this.clearLoading(componentId);

    if (errors.length === 0) {
      this.showSuccess(successMessage);
    } else if (errors.length === operations.length) {
      this.setError(componentId, new Error(errorMessage));
    } else {
      this.showWarning(`${operations.length - errors.length} of ${operations.length} operations completed successfully`);
    }

    return { results, errors };
  }

  /**
   * Clear all states for a component
   */
  clearAll(componentId) {
    this.clearLoading(componentId);
    this.clearError(componentId);
  }

  /**
   * Get loading state for a component
   */
  isLoading(componentId) {
    const state = this.loadingStates.get(componentId);
    return state ? state.loading : false;
  }

  /**
   * Get error state for a component
   */
  hasError(componentId) {
    return this.errorStates.has(componentId);
  }

  /**
   * Get all active loading states
   */
  getAllLoadingStates() {
    return Array.from(this.loadingStates.entries()).map(([id, state]) => ({
      componentId: id,
      ...state
    }));
  }

  /**
   * Get all active error states
   */
  getAllErrorStates() {
    return Array.from(this.errorStates.entries()).map(([id, state]) => ({
      componentId: id,
      ...state
    }));
  }
}

// Create singleton instance
const feedbackManager = new FeedbackManager();

// Export convenience functions
export const setLoading = (componentId, loading, message) => 
  feedbackManager.setLoading(componentId, loading, message);

export const setError = (componentId, error, context) => 
  feedbackManager.setError(componentId, error, context);

export const clearError = (componentId) => 
  feedbackManager.clearError(componentId);

export const clearLoading = (componentId) => 
  feedbackManager.clearLoading(componentId);

export const executeWithFeedback = (componentId, operation, options) => 
  feedbackManager.executeWithFeedback(componentId, operation, options);

export const registerComponent = (componentId, callback) => 
  feedbackManager.register(componentId, callback);

export const showSuccess = (message, title) => 
  feedbackManager.showSuccess(message, title);

export const showError = (message, title) => 
  feedbackManager.showError(message, title);

export const showInfo = (message, title) => 
  feedbackManager.showInfo(message, title);

export const showWarning = (message, title) => 
  feedbackManager.showWarning(message, title);

export default feedbackManager;