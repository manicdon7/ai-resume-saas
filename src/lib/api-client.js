/**
 * Enhanced API Client
 * Integrates network error handling, offline support, and caching
 */

import networkManager, { enhancedFetch } from './network-manager';
import offlineStorage, { CacheStrategies, StorageTypes } from './offline-storage';
import { handleError, ErrorTypes, AppError } from './error-handler';
import { attemptRecovery } from './error-recovery';

/**
 * API Client Configuration
 */
const DEFAULT_CONFIG = {
  baseURL: '',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  cacheStrategy: CacheStrategies.NETWORK_FIRST,
  cacheStorage: StorageTypes.MEMORY,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  headers: {
    'Content-Type': 'application/json'
  }
};

/**
 * Enhanced API Client Class
 */
class ApiClient {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.interceptors = {
      request: [],
      response: []
    };
    
    this.setupCacheConfig();
  }

  /**
   * Setup cache configuration for different endpoints
   */
  setupCacheConfig() {
    // Dashboard data - cache for 2 minutes
    offlineStorage.setCacheConfig('/api/user/dashboard', {
      ttl: 2 * 60 * 1000,
      storageType: StorageTypes.LOCAL_STORAGE,
      strategy: CacheStrategies.STALE_WHILE_REVALIDATE
    });

    // User profile - cache for 10 minutes
    offlineStorage.setCacheConfig('/api/user/profile', {
      ttl: 10 * 60 * 1000,
      storageType: StorageTypes.LOCAL_STORAGE,
      strategy: CacheStrategies.CACHE_FIRST
    });

    // Credits data - cache for 1 minute
    offlineStorage.setCacheConfig('/api/user/credits', {
      ttl: 60 * 1000,
      storageType: StorageTypes.MEMORY,
      strategy: CacheStrategies.NETWORK_FIRST
    });

    // Resume data - cache for 5 minutes
    offlineStorage.setCacheConfig('/api/resume/', {
      ttl: 5 * 60 * 1000,
      storageType: StorageTypes.LOCAL_STORAGE,
      strategy: CacheStrategies.CACHE_FIRST
    });

    // Job search results - cache for 30 minutes
    offlineStorage.setCacheConfig('/api/jobs/search', {
      ttl: 30 * 60 * 1000,
      storageType: StorageTypes.SESSION_STORAGE,
      strategy: CacheStrategies.STALE_WHILE_REVALIDATE
    });
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor);
  }

  /**
   * Apply request interceptors
   */
  async applyRequestInterceptors(config) {
    let modifiedConfig = { ...config };
    
    for (const interceptor of this.interceptors.request) {
      try {
        modifiedConfig = await interceptor(modifiedConfig);
      } catch (error) {
        console.error('Request interceptor error:', error);
      }
    }
    
    return modifiedConfig;
  }

  /**
   * Apply response interceptors
   */
  async applyResponseInterceptors(response, config) {
    let modifiedResponse = response;
    
    for (const interceptor of this.interceptors.response) {
      try {
        modifiedResponse = await interceptor(modifiedResponse, config);
      } catch (error) {
        console.error('Response interceptor error:', error);
      }
    }
    
    return modifiedResponse;
  }

  /**
   * Build full URL
   */
  buildUrl(endpoint) {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    return `${this.config.baseURL}${endpoint}`;
  }

  /**
   * Generate cache key for request
   */
  generateCacheKey(method, url, params = {}) {
    const sortedParams = Object.keys(params).sort().reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {});
    
    return `${method.toUpperCase()}_${url}_${JSON.stringify(sortedParams)}`;
  }

  /**
   * Check cache based on strategy
   */
  async checkCache(cacheKey, strategy) {
    const cached = await offlineStorage.get(cacheKey);
    
    if (!cached) return null;

    switch (strategy) {
      case CacheStrategies.CACHE_ONLY:
      case CacheStrategies.CACHE_FIRST:
        return cached;
      
      case CacheStrategies.STALE_WHILE_REVALIDATE:
        // Return cached data immediately, fetch fresh data in background
        return cached;
      
      case CacheStrategies.NETWORK_FIRST:
      case CacheStrategies.NETWORK_ONLY:
      default:
        return null;
    }
  }

  /**
   * Main request method
   */
  async request(method, endpoint, options = {}) {
    const {
      data,
      params = {},
      headers = {},
      cache = true,
      cacheStrategy = this.config.cacheStrategy,
      cacheTTL = this.config.cacheTTL,
      timeout = this.config.timeout,
      retries = this.config.retries,
      ...fetchOptions
    } = options;

    const url = this.buildUrl(endpoint);
    const cacheKey = this.generateCacheKey(method, url, params);

    // Build request configuration
    let requestConfig = {
      method: method.toUpperCase(),
      headers: {
        ...this.config.headers,
        ...headers
      },
      timeout,
      retries,
      ...fetchOptions
    };

    // Add authentication header if available
    const authToken = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (authToken) {
      requestConfig.headers.Authorization = `Bearer ${authToken}`;
    }

    // Add body for POST/PUT/PATCH requests
    if (data && ['POST', 'PUT', 'PATCH'].includes(requestConfig.method)) {
      requestConfig.body = JSON.stringify(data);
    }

    // Add query parameters for GET requests
    let finalUrl = url;
    if (Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      finalUrl = `${url}${url.includes('?') ? '&' : '?'}${searchParams}`;
    }

    // Apply request interceptors
    requestConfig = await this.applyRequestInterceptors(requestConfig);

    // Check cache based on strategy
    if (cache && ['GET', 'HEAD'].includes(requestConfig.method)) {
      const cached = await this.checkCache(cacheKey, cacheStrategy);
      
      if (cached) {
        // For stale-while-revalidate, fetch fresh data in background
        if (cacheStrategy === CacheStrategies.STALE_WHILE_REVALIDATE) {
          this.fetchFreshData(finalUrl, requestConfig, cacheKey, cacheTTL);
        }
        
        return {
          data: cached.data,
          fromCache: true,
          timestamp: cached.timestamp
        };
      }

      // For cache-only strategy, return null if no cache
      if (cacheStrategy === CacheStrategies.CACHE_ONLY) {
        throw new AppError(
          'No cached data available',
          ErrorTypes.NOT_FOUND,
          'low',
          { cacheKey, strategy: cacheStrategy }
        );
      }
    }

    // For network-only or when cache miss, make network request
    try {
      const response = await this.makeNetworkRequest(finalUrl, requestConfig);
      const responseData = await this.parseResponse(response);

      // Apply response interceptors
      const finalResponse = await this.applyResponseInterceptors(responseData, requestConfig);

      // Cache successful GET/HEAD responses
      if (cache && ['GET', 'HEAD'].includes(requestConfig.method) && response.ok) {
        await offlineStorage.set(cacheKey, finalResponse, {
          ttl: cacheTTL,
          storageType: this.config.cacheStorage
        });
      }

      return {
        data: finalResponse,
        fromCache: false,
        status: response.status,
        headers: response.headers
      };
    } catch (error) {
      // Try to return cached data as fallback for network errors
      if (cache && ['GET', 'HEAD'].includes(requestConfig.method)) {
        const cached = await offlineStorage.get(cacheKey);
        if (cached) {
          console.warn('Network request failed, returning cached data:', error.message);
          return {
            data: cached.data,
            fromCache: true,
            timestamp: cached.timestamp,
            error: error
          };
        }
      }

      throw error;
    }
  }

  /**
   * Make network request with enhanced error handling
   */
  async makeNetworkRequest(url, config) {
    try {
      return await enhancedFetch(url, config);
    } catch (error) {
      // Enhance error with additional context
      const enhancedError = handleError(error, {
        url,
        method: config.method,
        timestamp: new Date().toISOString()
      });

      // Attempt recovery for certain error types
      if ([ErrorTypes.NETWORK, ErrorTypes.SERVER].includes(enhancedError.type)) {
        try {
          return await attemptRecovery(
            enhancedError,
            () => enhancedFetch(url, config),
            { maxRetries: config.retries || 3 }
          );
        } catch (recoveryError) {
          throw recoveryError;
        }
      }

      throw enhancedError;
    }
  }

  /**
   * Parse response data
   */
  async parseResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else if (contentType && contentType.includes('text/')) {
      return await response.text();
    } else {
      return await response.blob();
    }
  }

  /**
   * Fetch fresh data in background (for stale-while-revalidate)
   */
  async fetchFreshData(url, config, cacheKey, cacheTTL) {
    try {
      const response = await this.makeNetworkRequest(url, config);
      const data = await this.parseResponse(response);
      
      if (response.ok) {
        await offlineStorage.set(cacheKey, data, {
          ttl: cacheTTL,
          storageType: this.config.cacheStorage
        });
      }
    } catch (error) {
      console.warn('Background refresh failed:', error.message);
    }
  }

  /**
   * Convenience methods
   */
  get(endpoint, options = {}) {
    return this.request('GET', endpoint, options);
  }

  post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, { ...options, data });
  }

  put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, { ...options, data });
  }

  patch(endpoint, data, options = {}) {
    return this.request('PATCH', endpoint, { ...options, data });
  }

  delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, options);
  }

  /**
   * Clear cache for specific patterns
   */
  async clearCache(pattern = null) {
    if (pattern) {
      // Clear specific cache entries matching pattern
      // This would require implementing pattern matching in offline storage
      console.log(`Clearing cache for pattern: ${pattern}`);
    } else {
      await offlineStorage.clear();
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return await offlineStorage.getStats();
  }

  /**
   * Prefetch data
   */
  async prefetch(endpoint, options = {}) {
    try {
      await this.get(endpoint, { ...options, cache: true });
    } catch (error) {
      console.warn('Prefetch failed:', error.message);
    }
  }

  /**
   * Batch requests
   */
  async batch(requests) {
    const results = await Promise.allSettled(
      requests.map(({ method, endpoint, ...options }) => 
        this.request(method, endpoint, options)
      )
    );

    return results.map((result, index) => ({
      ...requests[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  }
}

// Create default instance
const apiClient = new ApiClient();

// Add default request interceptor for authentication
apiClient.addRequestInterceptor(async (config) => {
  // Add timestamp to prevent caching issues
  if (config.method === 'GET') {
    config.headers['X-Request-Time'] = Date.now().toString();
  }
  
  return config;
});

// Add default response interceptor for error handling
apiClient.addResponseInterceptor(async (response, config) => {
  // Log successful requests in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ ${config.method} ${config.url}:`, response);
  }
  
  return response;
});

// Export convenience functions
export const get = (endpoint, options) => apiClient.get(endpoint, options);
export const post = (endpoint, data, options) => apiClient.post(endpoint, data, options);
export const put = (endpoint, data, options) => apiClient.put(endpoint, data, options);
export const patch = (endpoint, data, options) => apiClient.patch(endpoint, data, options);
export const del = (endpoint, options) => apiClient.delete(endpoint, options);
export const clearCache = (pattern) => apiClient.clearCache(pattern);
export const getCacheStats = () => apiClient.getCacheStats();

export default apiClient;