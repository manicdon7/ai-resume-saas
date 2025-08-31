/**
 * Network Manager
 * Handles network connectivity detection, offline support, and request retry logic
 */

import { ErrorTypes, AppError } from './error-handler';

/**
 * Network Status Manager
 */
class NetworkManager {
  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.listeners = new Set();
    this.requestQueue = [];
    this.retryAttempts = new Map();
    this.maxRetryAttempts = 3;
    this.baseRetryDelay = 1000;
    this.maxRetryDelay = 30000;
    
    this.initializeNetworkListeners();
  }

  /**
   * Initialize network event listeners
   */
  initializeNetworkListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
      
      // Additional connectivity checks
      this.startConnectivityMonitoring();
    }
  }

  /**
   * Start periodic connectivity monitoring
   */
  startConnectivityMonitoring() {
    // Check connectivity every 30 seconds when online
    setInterval(() => {
      if (this.isOnline) {
        this.checkConnectivity();
      }
    }, 30000);
  }

  /**
   * Check actual connectivity by making a lightweight request
   */
  async checkConnectivity() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/health-check', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      
      const wasOnline = this.isOnline;
      this.isOnline = response.ok;
      
      if (!wasOnline && this.isOnline) {
        this.handleOnline();
      } else if (wasOnline && !this.isOnline) {
        this.handleOffline();
      }
    } catch (error) {
      const wasOnline = this.isOnline;
      this.isOnline = false;
      
      if (wasOnline) {
        this.handleOffline();
      }
    }
  }

  /**
   * Handle online event
   */
  handleOnline() {
    console.log('🌐 Network connection restored');
    this.isOnline = true;
    this.notifyListeners('online');
    this.processQueuedRequests();
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    console.log('📵 Network connection lost');
    this.isOnline = false;
    this.notifyListeners('offline');
  }

  /**
   * Add network status listener
   */
  addListener(callback) {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of network status change
   */
  notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback(status, this.isOnline);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  /**
   * Enhanced fetch with retry logic and offline support
   */
  async fetch(url, options = {}) {
    const requestId = `${url}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // If offline, queue the request
    if (!this.isOnline) {
      return this.queueRequest(requestId, url, options);
    }

    return this.executeRequest(requestId, url, options);
  }

  /**
   * Execute a network request with retry logic
   */
  async executeRequest(requestId, url, options = {}) {
    const {
      retries = this.maxRetryAttempts,
      retryDelay = this.baseRetryDelay,
      timeout = 30000,
      ...fetchOptions
    } = options;

    let lastError;
    let attempt = 0;

    while (attempt <= retries) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Clear retry attempts on success
        this.retryAttempts.delete(requestId);

        // Check if response indicates network issues
        if (!response.ok) {
          throw new AppError(
            `HTTP ${response.status}: ${response.statusText}`,
            this.getErrorTypeFromStatus(response.status),
            'medium',
            { status: response.status, url }
          );
        }

        return response;
      } catch (error) {
        lastError = error;
        attempt++;

        // Don't retry for certain error types
        if (this.shouldNotRetry(error)) {
          throw error;
        }

        // If we've exhausted retries, throw the error
        if (attempt > retries) {
          throw new AppError(
            `Request failed after ${retries} retries: ${error.message}`,
            ErrorTypes.NETWORK,
            'high',
            { originalError: error, url, attempts: attempt }
          );
        }

        // Calculate exponential backoff delay
        const delay = Math.min(
          retryDelay * Math.pow(2, attempt - 1),
          this.maxRetryDelay
        );

        console.log(`Retrying request to ${url} in ${delay}ms (attempt ${attempt}/${retries})`);
        
        // Track retry attempts
        this.retryAttempts.set(requestId, attempt);

        // Wait before retrying
        await this.delay(delay);

        // Check if we're still online before retrying
        if (!this.isOnline) {
          throw new AppError(
            'Network connection lost during retry',
            ErrorTypes.NETWORK,
            'medium',
            { url, attempts: attempt }
          );
        }
      }
    }

    throw lastError;
  }

  /**
   * Queue request for when network comes back online
   */
  async queueRequest(requestId, url, options) {
    return new Promise((resolve, reject) => {
      const queuedRequest = {
        id: requestId,
        url,
        options,
        resolve,
        reject,
        timestamp: Date.now()
      };

      this.requestQueue.push(queuedRequest);
      
      console.log(`Queued request to ${url} (${this.requestQueue.length} requests in queue)`);

      // Set a timeout for queued requests
      setTimeout(() => {
        const index = this.requestQueue.findIndex(req => req.id === requestId);
        if (index > -1) {
          this.requestQueue.splice(index, 1);
          reject(new AppError(
            'Request timeout while offline',
            ErrorTypes.NETWORK,
            'medium',
            { url, queuedAt: queuedRequest.timestamp }
          ));
        }
      }, 300000); // 5 minutes timeout for queued requests
    });
  }

  /**
   * Process queued requests when network comes back online
   */
  async processQueuedRequests() {
    if (this.requestQueue.length === 0) return;

    console.log(`Processing ${this.requestQueue.length} queued requests`);

    const requests = [...this.requestQueue];
    this.requestQueue = [];

    for (const request of requests) {
      try {
        const response = await this.executeRequest(request.id, request.url, request.options);
        request.resolve(response);
      } catch (error) {
        request.reject(error);
      }
    }
  }

  /**
   * Determine error type from HTTP status
   */
  getErrorTypeFromStatus(status) {
    if (status >= 400 && status < 500) {
      if (status === 401) return ErrorTypes.AUTHENTICATION;
      if (status === 403) return ErrorTypes.PERMISSION;
      if (status === 404) return ErrorTypes.NOT_FOUND;
      if (status === 422) return ErrorTypes.VALIDATION;
      return ErrorTypes.CLIENT;
    } else if (status >= 500) {
      return ErrorTypes.SERVER;
    }
    return ErrorTypes.NETWORK;
  }

  /**
   * Check if error should not be retried
   */
  shouldNotRetry(error) {
    // Don't retry authentication, permission, or validation errors
    if (error instanceof AppError) {
      return [
        ErrorTypes.AUTHENTICATION,
        ErrorTypes.PERMISSION,
        ErrorTypes.VALIDATION
      ].includes(error.type);
    }

    // Don't retry AbortError (timeout)
    if (error.name === 'AbortError') {
      return false; // Actually, we should retry timeouts
    }

    return false;
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current network status
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      queuedRequests: this.requestQueue.length,
      activeRetries: this.retryAttempts.size
    };
  }

  /**
   * Clear queued requests
   */
  clearQueue() {
    this.requestQueue.forEach(request => {
      request.reject(new AppError(
        'Request cancelled',
        ErrorTypes.CLIENT,
        'low'
      ));
    });
    this.requestQueue = [];
  }

  /**
   * Get retry count for a request
   */
  getRetryCount(requestId) {
    return this.retryAttempts.get(requestId) || 0;
  }

  /**
   * Cancel specific request
   */
  cancelRequest(requestId) {
    const index = this.requestQueue.findIndex(req => req.id === requestId);
    if (index > -1) {
      const request = this.requestQueue.splice(index, 1)[0];
      request.reject(new AppError(
        'Request cancelled',
        ErrorTypes.CLIENT,
        'low'
      ));
    }
  }
}

// Create singleton instance
const networkManager = new NetworkManager();

// Export convenience functions
export const enhancedFetch = (url, options) => networkManager.fetch(url, options);
export const addNetworkListener = (callback) => networkManager.addListener(callback);
export const getNetworkStatus = () => networkManager.getStatus();
export const clearRequestQueue = () => networkManager.clearQueue();

export default networkManager;