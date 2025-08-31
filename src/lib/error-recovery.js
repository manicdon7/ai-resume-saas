/**
 * Error Recovery Mechanisms
 * Provides automatic recovery strategies for different types of errors
 */

import { ErrorTypes, ErrorSeverity, AppError } from './error-handler';

/**
 * Recovery strategies for different error types
 */
export const RecoveryStrategies = {
  RETRY: 'retry',
  FALLBACK: 'fallback',
  REDIRECT: 'redirect',
  REFRESH: 'refresh',
  CLEAR_CACHE: 'clear_cache',
  REAUTH: 'reauth',
  NONE: 'none'
};

/**
 * Error Recovery Manager
 */
class ErrorRecoveryManager {
  constructor() {
    this.recoveryStrategies = new Map();
    this.fallbackData = new Map();
    this.recoveryAttempts = new Map();
    
    this.initializeDefaultStrategies();
  }

  /**
   * Initialize default recovery strategies for different error types
   */
  initializeDefaultStrategies() {
    // Network errors - retry with exponential backoff
    this.setRecoveryStrategy(ErrorTypes.NETWORK, {
      strategy: RecoveryStrategies.RETRY,
      maxAttempts: 3,
      backoffMultiplier: 2,
      baseDelay: 1000,
      fallbackStrategy: RecoveryStrategies.FALLBACK
    });

    // Authentication errors - redirect to login
    this.setRecoveryStrategy(ErrorTypes.AUTHENTICATION, {
      strategy: RecoveryStrategies.REAUTH,
      redirectUrl: '/login',
      clearStorage: true
    });

    // Permission errors - show message, no automatic recovery
    this.setRecoveryStrategy(ErrorTypes.PERMISSION, {
      strategy: RecoveryStrategies.NONE,
      showMessage: true
    });

    // Not found errors - redirect to home or show fallback
    this.setRecoveryStrategy(ErrorTypes.NOT_FOUND, {
      strategy: RecoveryStrategies.FALLBACK,
      fallbackStrategy: RecoveryStrategies.REDIRECT,
      redirectUrl: '/'
    });

    // Server errors - retry then fallback
    this.setRecoveryStrategy(ErrorTypes.SERVER, {
      strategy: RecoveryStrategies.RETRY,
      maxAttempts: 2,
      backoffMultiplier: 1.5,
      baseDelay: 2000,
      fallbackStrategy: RecoveryStrategies.FALLBACK
    });

    // Client errors - refresh page
    this.setRecoveryStrategy(ErrorTypes.CLIENT, {
      strategy: RecoveryStrategies.REFRESH,
      showConfirmation: true
    });

    // Validation errors - no automatic recovery
    this.setRecoveryStrategy(ErrorTypes.VALIDATION, {
      strategy: RecoveryStrategies.NONE,
      showMessage: true
    });
  }

  /**
   * Set recovery strategy for an error type
   */
  setRecoveryStrategy(errorType, config) {
    this.recoveryStrategies.set(errorType, config);
  }

  /**
   * Get recovery strategy for an error type
   */
  getRecoveryStrategy(errorType) {
    return this.recoveryStrategies.get(errorType) || {
      strategy: RecoveryStrategies.NONE,
      showMessage: true
    };
  }

  /**
   * Attempt to recover from an error
   */
  async attemptRecovery(error, operation, context = {}) {
    const appError = error instanceof AppError ? error : new AppError(error.message);
    const strategy = this.getRecoveryStrategy(appError.type);
    const recoveryId = `${appError.type}_${Date.now()}`;

    console.log(`Attempting recovery for ${appError.type} using strategy: ${strategy.strategy}`);

    try {
      switch (strategy.strategy) {
        case RecoveryStrategies.RETRY:
          return await this.retryWithBackoff(operation, strategy, recoveryId);
        
        case RecoveryStrategies.FALLBACK:
          return await this.useFallbackData(appError, context);
        
        case RecoveryStrategies.REDIRECT:
          return this.redirectUser(strategy.redirectUrl || '/');
        
        case RecoveryStrategies.REFRESH:
          return this.refreshPage(strategy.showConfirmation);
        
        case RecoveryStrategies.CLEAR_CACHE:
          return this.clearCacheAndRetry(operation, context);
        
        case RecoveryStrategies.REAUTH:
          return this.reauthenticateUser(strategy);
        
        case RecoveryStrategies.NONE:
        default:
          throw appError;
      }
    } catch (recoveryError) {
      // If primary recovery fails, try fallback strategy
      if (strategy.fallbackStrategy && strategy.fallbackStrategy !== strategy.strategy) {
        console.log(`Primary recovery failed, trying fallback: ${strategy.fallbackStrategy}`);
        const fallbackStrategy = { ...strategy, strategy: strategy.fallbackStrategy };
        return this.attemptRecovery(recoveryError, operation, context);
      }
      
      throw recoveryError;
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  async retryWithBackoff(operation, strategy, recoveryId) {
    const maxAttempts = strategy.maxAttempts || 3;
    const baseDelay = strategy.baseDelay || 1000;
    const backoffMultiplier = strategy.backoffMultiplier || 2;
    
    let attempts = this.recoveryAttempts.get(recoveryId) || 0;

    while (attempts < maxAttempts) {
      try {
        if (attempts > 0) {
          const delay = baseDelay * Math.pow(backoffMultiplier, attempts - 1);
          console.log(`Retrying in ${delay}ms (attempt ${attempts + 1}/${maxAttempts})`);
          await this.delay(delay);
        }

        const result = await operation();
        this.recoveryAttempts.delete(recoveryId);
        return result;
      } catch (error) {
        attempts++;
        this.recoveryAttempts.set(recoveryId, attempts);
        
        if (attempts >= maxAttempts) {
          this.recoveryAttempts.delete(recoveryId);
          throw new AppError(
            `Operation failed after ${maxAttempts} retry attempts`,
            ErrorTypes.CLIENT,
            ErrorSeverity.HIGH,
            { originalError: error, attempts }
          );
        }
      }
    }
  }

  /**
   * Use fallback data when available
   */
  async useFallbackData(error, context) {
    const fallbackKey = context.fallbackKey || error.type;
    const fallbackData = this.fallbackData.get(fallbackKey);

    if (fallbackData) {
      console.log(`Using fallback data for ${fallbackKey}`);
      return {
        data: fallbackData,
        isFallback: true,
        originalError: error
      };
    }

    // Try to get cached data from localStorage
    if (typeof localStorage !== 'undefined' && context.cacheKey) {
      try {
        const cachedData = localStorage.getItem(context.cacheKey);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          console.log(`Using cached data for ${context.cacheKey}`);
          return {
            data: parsed,
            isFallback: true,
            isFromCache: true,
            originalError: error
          };
        }
      } catch (cacheError) {
        console.warn('Failed to retrieve cached data:', cacheError);
      }
    }

    throw error;
  }

  /**
   * Redirect user to a different page
   */
  redirectUser(url) {
    if (typeof window !== 'undefined') {
      console.log(`Redirecting to ${url}`);
      window.location.href = url;
      return { redirected: true, url };
    }
    throw new AppError('Cannot redirect in server environment', ErrorTypes.CLIENT);
  }

  /**
   * Refresh the current page
   */
  refreshPage(showConfirmation = false) {
    if (typeof window !== 'undefined') {
      if (showConfirmation) {
        const confirmed = window.confirm(
          'An error occurred. Would you like to refresh the page to try again?'
        );
        if (!confirmed) {
          throw new AppError('User declined page refresh', ErrorTypes.CLIENT);
        }
      }
      
      console.log('Refreshing page for error recovery');
      window.location.reload();
      return { refreshed: true };
    }
    throw new AppError('Cannot refresh in server environment', ErrorTypes.CLIENT);
  }

  /**
   * Clear cache and retry operation
   */
  async clearCacheAndRetry(operation, context) {
    console.log('Clearing cache and retrying operation');
    
    // Clear relevant localStorage items
    if (typeof localStorage !== 'undefined' && context.cacheKeys) {
      context.cacheKeys.forEach(key => {
        localStorage.removeItem(key);
      });
    }

    // Clear specific fallback data
    if (context.fallbackKey) {
      this.fallbackData.delete(context.fallbackKey);
    }

    // Retry the operation
    return await operation();
  }

  /**
   * Reauthenticate user
   */
  reauthenticateUser(strategy) {
    console.log('Initiating reauthentication');
    
    if (typeof localStorage !== 'undefined' && strategy.clearStorage) {
      // Clear authentication data
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
    }

    // Redirect to login page
    return this.redirectUser(strategy.redirectUrl || '/login');
  }

  /**
   * Set fallback data for a specific key
   */
  setFallbackData(key, data) {
    this.fallbackData.set(key, data);
  }

  /**
   * Get fallback data for a specific key
   */
  getFallbackData(key) {
    return this.fallbackData.get(key);
  }

  /**
   * Clear fallback data
   */
  clearFallbackData(key) {
    if (key) {
      this.fallbackData.delete(key);
    } else {
      this.fallbackData.clear();
    }
  }

  /**
   * Utility function to create a delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if recovery is possible for an error type
   */
  canRecover(errorType) {
    const strategy = this.getRecoveryStrategy(errorType);
    return strategy.strategy !== RecoveryStrategies.NONE;
  }

  /**
   * Get recovery attempt count for a specific recovery ID
   */
  getRecoveryAttempts(recoveryId) {
    return this.recoveryAttempts.get(recoveryId) || 0;
  }

  /**
   * Clear recovery attempts for a specific recovery ID
   */
  clearRecoveryAttempts(recoveryId) {
    this.recoveryAttempts.delete(recoveryId);
  }
}

// Create singleton instance
const errorRecoveryManager = new ErrorRecoveryManager();

// Export convenience functions
export const attemptRecovery = (error, operation, context) => 
  errorRecoveryManager.attemptRecovery(error, operation, context);

export const setFallbackData = (key, data) => 
  errorRecoveryManager.setFallbackData(key, data);

export const setRecoveryStrategy = (errorType, config) => 
  errorRecoveryManager.setRecoveryStrategy(errorType, config);

export const canRecover = (errorType) => 
  errorRecoveryManager.canRecover(errorType);

export default errorRecoveryManager;