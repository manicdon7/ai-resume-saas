/**
 * Centralized Error Handling System
 * Provides consistent error handling, logging, and user feedback across the application
 */

// Error types for categorization
export const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  AUTHENTICATION: 'AUTH_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  PERMISSION: 'PERMISSION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  SERVER: 'SERVER_ERROR',
  CLIENT: 'CLIENT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// Error severity levels
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Enhanced Error class with additional context
 */
export class AppError extends Error {
  constructor(message, type = ErrorTypes.UNKNOWN, severity = ErrorSeverity.MEDIUM, context = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.id = this.generateErrorId();
  }

  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

/**
 * Global Error Handler Class
 */
class GlobalErrorHandler {
  constructor() {
    this.errorListeners = [];
    this.retryAttempts = new Map();
    this.maxRetryAttempts = 3;
    this.retryDelay = 1000; // Base delay in ms
    
    // Initialize global error listeners
    this.initializeGlobalHandlers();
  }

  initializeGlobalHandlers() {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(
          new AppError(
            event.reason?.message || 'Unhandled promise rejection',
            ErrorTypes.CLIENT,
            ErrorSeverity.HIGH,
            { reason: event.reason }
          )
        );
      });

      // Handle global JavaScript errors
      window.addEventListener('error', (event) => {
        this.handleError(
          new AppError(
            event.message || 'Global JavaScript error',
            ErrorTypes.CLIENT,
            ErrorSeverity.HIGH,
            { 
              filename: event.filename,
              lineno: event.lineno,
              colno: event.colno
            }
          )
        );
      });
    }
  }

  /**
   * Main error handling method
   */
  handleError(error, context = {}) {
    const appError = this.normalizeError(error, context);
    
    // Log the error
    this.logError(appError);
    
    // Notify listeners
    this.notifyListeners(appError);
    
    // Return user-friendly message
    return this.getUserFriendlyMessage(appError);
  }

  /**
   * Normalize different error types to AppError
   */
  normalizeError(error, context = {}) {
    if (error instanceof AppError) {
      return error;
    }

    let type = ErrorTypes.UNKNOWN;
    let severity = ErrorSeverity.MEDIUM;

    // Categorize error based on message or properties
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      type = ErrorTypes.CLIENT;
      severity = ErrorSeverity.HIGH;
    } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
      type = ErrorTypes.NETWORK;
      severity = ErrorSeverity.MEDIUM;
    } else if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
      type = ErrorTypes.AUTHENTICATION;
      severity = ErrorSeverity.HIGH;
    } else if (error.message?.includes('403') || error.message?.includes('forbidden')) {
      type = ErrorTypes.PERMISSION;
      severity = ErrorSeverity.HIGH;
    } else if (error.message?.includes('404') || error.message?.includes('not found')) {
      type = ErrorTypes.NOT_FOUND;
      severity = ErrorSeverity.LOW;
    } else if (error.message?.includes('500') || error.message?.includes('server')) {
      type = ErrorTypes.SERVER;
      severity = ErrorSeverity.HIGH;
    }

    return new AppError(
      error.message || 'An unexpected error occurred',
      type,
      severity,
      { ...context, originalError: error }
    );
  }

  /**
   * Log error with appropriate level
   */
  logError(appError) {
    const logData = {
      ...appError.toJSON(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userId: this.getCurrentUserId()
    };

    // Console logging based on severity
    switch (appError.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('🚨 CRITICAL ERROR:', logData);
        break;
      case ErrorSeverity.HIGH:
        console.error('❌ HIGH SEVERITY ERROR:', logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('⚠️ MEDIUM SEVERITY ERROR:', logData);
        break;
      case ErrorSeverity.LOW:
        console.info('ℹ️ LOW SEVERITY ERROR:', logData);
        break;
      default:
        console.log('📝 ERROR:', logData);
    }

    // Send to external monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(logData);
    }
  }

  /**
   * Send error to external monitoring service
   */
  sendToMonitoringService(errorData) {
    // Example implementation for Sentry, LogRocket, etc.
    try {
      // if (window.Sentry) {
      //   window.Sentry.captureException(new Error(errorData.message), {
      //     extra: errorData.context,
      //     tags: { 
      //       type: errorData.type,
      //       severity: errorData.severity
      //     }
      //   });
      // }
      
      // For now, just log that we would send to monitoring
      console.log('📊 Would send to monitoring service:', errorData.id);
    } catch (monitoringError) {
      console.error('Failed to send error to monitoring service:', monitoringError);
    }
  }

  /**
   * Get current user ID for error context
   */
  getCurrentUserId() {
    try {
      // Try to get user ID from localStorage or Redux store
      const authToken = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (authToken) {
        // In a real app, you might decode the JWT to get user ID
        return 'authenticated_user';
      }
      return 'anonymous_user';
    } catch {
      return 'unknown_user';
    }
  }

  /**
   * Generate user-friendly error messages
   */
  getUserFriendlyMessage(appError) {
    const messages = {
      [ErrorTypes.NETWORK]: 'Connection problem. Please check your internet connection and try again.',
      [ErrorTypes.AUTHENTICATION]: 'Please sign in again to continue.',
      [ErrorTypes.PERMISSION]: 'You don\'t have permission to perform this action.',
      [ErrorTypes.NOT_FOUND]: 'The requested information could not be found.',
      [ErrorTypes.SERVER]: 'Server is temporarily unavailable. Please try again in a few minutes.',
      [ErrorTypes.VALIDATION]: 'Please check your input and try again.',
      [ErrorTypes.CLIENT]: 'Something went wrong. Please refresh the page and try again.',
      [ErrorTypes.UNKNOWN]: 'An unexpected error occurred. Please try again.'
    };

    return messages[appError.type] || messages[ErrorTypes.UNKNOWN];
  }

  /**
   * Retry mechanism with exponential backoff
   */
  async retryOperation(operation, operationId, maxAttempts = this.maxRetryAttempts) {
    const attempts = this.retryAttempts.get(operationId) || 0;
    
    if (attempts >= maxAttempts) {
      this.retryAttempts.delete(operationId);
      throw new AppError(
        `Operation failed after ${maxAttempts} attempts`,
        ErrorTypes.CLIENT,
        ErrorSeverity.HIGH,
        { operationId, attempts }
      );
    }

    try {
      const result = await operation();
      this.retryAttempts.delete(operationId);
      return result;
    } catch (error) {
      const newAttempts = attempts + 1;
      this.retryAttempts.set(operationId, newAttempts);
      
      // Calculate exponential backoff delay
      const delay = this.retryDelay * Math.pow(2, attempts);
      
      console.log(`Retrying operation ${operationId} in ${delay}ms (attempt ${newAttempts}/${maxAttempts})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryOperation(operation, operationId, maxAttempts);
    }
  }

  /**
   * Add error listener
   */
  addErrorListener(listener) {
    this.errorListeners.push(listener);
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all error listeners
   */
  notifyListeners(appError) {
    this.errorListeners.forEach(listener => {
      try {
        listener(appError);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });
  }

  /**
   * Clear retry attempts for an operation
   */
  clearRetryAttempts(operationId) {
    this.retryAttempts.delete(operationId);
  }

  /**
   * Get retry count for an operation
   */
  getRetryCount(operationId) {
    return this.retryAttempts.get(operationId) || 0;
  }
}

// Create singleton instance
const globalErrorHandler = new GlobalErrorHandler();

// Export convenience functions
export const handleError = (error, context) => globalErrorHandler.handleError(error, context);
export const retryOperation = (operation, operationId, maxAttempts) => 
  globalErrorHandler.retryOperation(operation, operationId, maxAttempts);
export const addErrorListener = (listener) => globalErrorHandler.addErrorListener(listener);

export default globalErrorHandler;