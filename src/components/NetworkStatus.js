/**
 * Network Status Components
 * Provides network connectivity indicators and offline support UI
 */

import React, { useState, useEffect } from 'react';
import networkManager, { addNetworkListener, getNetworkStatus } from '../lib/network-manager';

/**
 * Network status indicator component
 */
export const NetworkStatusIndicator = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [queuedRequests, setQueuedRequests] = useState(0);

  useEffect(() => {
    // Get initial status
    const status = getNetworkStatus();
    setIsOnline(status.isOnline);
    setQueuedRequests(status.queuedRequests);

    // Listen for network status changes
    const unsubscribe = addNetworkListener((status, online) => {
      setIsOnline(online);
      const currentStatus = getNetworkStatus();
      setQueuedRequests(currentStatus.queuedRequests);
    });

    return unsubscribe;
  }, []);

  if (isOnline && queuedRequests === 0) {
    return null; // Don't show anything when online and no queued requests
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      {!isOnline ? (
        <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
          </svg>
          <span className="text-sm font-medium">
            You're offline
            {queuedRequests > 0 && ` (${queuedRequests} requests queued)`}
          </span>
        </div>
      ) : queuedRequests > 0 ? (
        <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <svg className="h-5 w-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-sm font-medium">
            Processing {queuedRequests} queued request{queuedRequests !== 1 ? 's' : ''}
          </span>
        </div>
      ) : null}
    </div>
  );
};

/**
 * Offline banner component
 */
export const OfflineBanner = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const status = getNetworkStatus();
    setIsOnline(status.isOnline);
    setShowBanner(!status.isOnline);

    const unsubscribe = addNetworkListener((status, online) => {
      setIsOnline(online);
      
      if (!online) {
        setShowBanner(true);
      } else {
        // Hide banner after a delay when coming back online
        setTimeout(() => setShowBanner(false), 3000);
      }
    });

    return unsubscribe;
  }, []);

  if (!showBanner) return null;

  return (
    <div className={`bg-gray-800 text-white ${className}`}>
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="w-0 flex-1 flex items-center">
            <span className="flex p-2 rounded-lg bg-gray-700">
              {isOnline ? (
                <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
                </svg>
              )}
            </span>
            <p className="ml-3 font-medium text-white">
              {isOnline ? (
                <span>Connection restored! Your queued actions are being processed.</span>
              ) : (
                <span>You're currently offline. Some features may be limited.</span>
              )}
            </p>
          </div>
          <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
            <button
              type="button"
              onClick={() => setShowBanner(false)}
              className="-mr-1 flex p-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-white sm:-mr-2"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Retry button component for failed network operations
 */
export const RetryButton = ({ onRetry, disabled = false, className = '' }) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (disabled || isRetrying) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <button
      onClick={handleRetry}
      disabled={disabled || isRetrying}
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isRetrying ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retrying...
        </>
      ) : (
        <>
          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </>
      )}
    </button>
  );
};

/**
 * Network-aware wrapper component
 */
export const NetworkAwareWrapper = ({ 
  children, 
  fallback = null, 
  showOfflineMessage = true,
  className = '' 
}) => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const status = getNetworkStatus();
    setIsOnline(status.isOnline);

    const unsubscribe = addNetworkListener((status, online) => {
      setIsOnline(online);
    });

    return unsubscribe;
  }, []);

  if (!isOnline) {
    if (fallback) {
      return fallback;
    }

    if (showOfflineMessage) {
      return (
        <div className={`flex items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${className}`}>
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">You're offline</h3>
            <p className="mt-1 text-sm text-gray-500">
              This content requires an internet connection. Please check your connection and try again.
            </p>
            <div className="mt-6">
              <RetryButton 
                onRetry={() => window.location.reload()}
                className="text-sm"
              />
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  return <div className={className}>{children}</div>;
};

/**
 * Hook for network status
 */
export const useNetworkStatus = () => {
  const [status, setStatus] = useState(() => getNetworkStatus());

  useEffect(() => {
    const unsubscribe = addNetworkListener(() => {
      setStatus(getNetworkStatus());
    });

    return unsubscribe;
  }, []);

  return status;
};

/**
 * Hook for offline-first data fetching
 */
export const useOfflineFirst = (fetchFunction, cacheKey, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const networkStatus = useNetworkStatus();

  const fetchData = async (forceNetwork = false) => {
    try {
      setLoading(true);
      setError(null);

      // Try cache first if offline or not forcing network
      if (!forceNetwork && (!networkStatus.isOnline || options.cacheFirst)) {
        const cached = await offlineStorage.get(cacheKey);
        if (cached) {
          setData(cached.data);
          setIsFromCache(true);
          setLoading(false);
          
          // If online, fetch fresh data in background
          if (networkStatus.isOnline && !options.cacheOnly) {
            fetchData(true);
          }
          return;
        }
      }

      // Fetch from network
      if (networkStatus.isOnline) {
        const result = await fetchFunction();
        setData(result);
        setIsFromCache(false);
        
        // Cache the result
        await offlineStorage.set(cacheKey, result, options.cacheOptions);
      } else {
        throw new Error('No cached data available and you are offline');
      }
    } catch (err) {
      setError(err);
      
      // Try to use stale cache data as fallback
      const cached = await offlineStorage.get(cacheKey);
      if (cached) {
        setData(cached.data);
        setIsFromCache(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [cacheKey]);

  // Refetch when coming back online
  useEffect(() => {
    if (networkStatus.isOnline && data && isFromCache) {
      fetchData(true);
    }
  }, [networkStatus.isOnline]);

  return {
    data,
    loading,
    error,
    isFromCache,
    refetch: () => fetchData(true),
    networkStatus
  };
};