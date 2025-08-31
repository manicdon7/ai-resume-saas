import React from 'react';
import { useDashboardService, useDashboardStats, useDashboardActivity } from '../hooks/useDashboardService';

/**
 * Example component demonstrating dashboard service usage
 * This shows how to use the dashboard service with real-time capabilities
 */
export const DashboardDataExample = () => {
  const {
    // State
    isLoading,
    isRefreshing,
    error,
    lastRefresh,
    autoRefreshEnabled,
    refreshInterval,
    networkStatus,
    cacheStatus,
    
    // Data
    user,
    stats,
    recentActivity,
    credits,
    
    // Actions
    fetchData,
    refresh,
    toggleAutoRefresh,
    updateRefreshInterval,
    clearCache,
    isDataFresh
  } = useDashboardService({
    autoRefresh: true,
    refreshInterval: 30000,
    preload: true
  });

  const handleManualRefresh = async () => {
    try {
      await refresh();
    } catch (error) {
      console.error('Manual refresh failed:', error);
    }
  };

  const handleToggleAutoRefresh = () => {
    toggleAutoRefresh();
  };

  const handleUpdateInterval = (newInterval) => {
    updateRefreshInterval(newInterval);
  };

  const handleClearCache = () => {
    clearCache();
  };

  if (isLoading && !user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading dashboard data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-600 font-medium">Error loading dashboard data</div>
          <button
            onClick={handleManualRefresh}
            className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
        <div className="text-red-500 text-sm mt-1">{error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Dashboard Controls</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Manual Refresh */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isRefreshing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Refreshing...
              </>
            ) : (
              'Refresh Now'
            )}
          </button>

          {/* Auto-refresh Toggle */}
          <button
            onClick={handleToggleAutoRefresh}
            className={`px-4 py-2 rounded ${
              autoRefreshEnabled
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            Auto-refresh: {autoRefreshEnabled ? 'ON' : 'OFF'}
          </button>

          {/* Refresh Interval */}
          <select
            value={refreshInterval}
            onChange={(e) => handleUpdateInterval(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value={15000}>15 seconds</option>
            <option value={30000}>30 seconds</option>
            <option value={60000}>1 minute</option>
            <option value={300000}>5 minutes</option>
          </select>

          {/* Clear Cache */}
          <button
            onClick={handleClearCache}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear Cache
          </button>
        </div>

        {/* Status Information */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Network:</span>
            <span className={`ml-2 px-2 py-1 rounded ${
              networkStatus === 'online' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {networkStatus}
            </span>
          </div>
          
          <div>
            <span className="font-medium">Cache:</span>
            <span className="ml-2">
              {cacheStatus.hasCache ? 'Available' : 'Empty'}
              {cacheStatus.cacheAge && ` (${Math.round(cacheStatus.cacheAge / 1000)}s old)`}
            </span>
          </div>
          
          <div>
            <span className="font-medium">Last Refresh:</span>
            <span className="ml-2">
              {lastRefresh 
                ? new Date(lastRefresh).toLocaleTimeString()
                : 'Never'
              }
            </span>
          </div>
        </div>
      </div>

      {/* User Stats */}
      {stats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.creditsRemaining}</div>
              <div className="text-sm text-gray-600">Credits Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.resumesCreated}</div>
              <div className="text-sm text-gray-600">Resumes Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.applicationsSent}</div>
              <div className="text-sm text-gray-600">Applications Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.jobSearches}</div>
              <div className="text-sm text-gray-600">Job Searches</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity && recentActivity.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={activity.id || index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <div className="font-medium">{activity.description}</div>
                  <div className="text-sm text-gray-600">Type: {activity.type}</div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(activity.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Freshness Indicator */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-sm text-gray-600">
          Data freshness: {isDataFresh() ? 'Fresh' : 'Stale'}
          {lastRefresh && (
            <span className="ml-2">
              (Updated {Math.round((Date.now() - new Date(lastRefresh).getTime()) / 1000)}s ago)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Simplified stats-only component
 */
export const DashboardStatsOnly = () => {
  const { stats, credits, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return <div>Loading stats...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error.message}</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg shadow text-center">
        <div className="text-2xl font-bold text-blue-600">{credits}</div>
        <div className="text-sm text-gray-600">Credits</div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow text-center">
        <div className="text-2xl font-bold text-green-600">{stats?.resumesCreated || 0}</div>
        <div className="text-sm text-gray-600">Resumes</div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow text-center">
        <div className="text-2xl font-bold text-purple-600">{stats?.applicationsSent || 0}</div>
        <div className="text-sm text-gray-600">Applications</div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow text-center">
        <div className="text-2xl font-bold text-orange-600">{stats?.jobSearches || 0}</div>
        <div className="text-sm text-gray-600">Searches</div>
      </div>
    </div>
  );
};

/**
 * Activity-only component
 */
export const DashboardActivityOnly = () => {
  const { recentActivity, isLoading, error } = useDashboardActivity();

  if (isLoading) {
    return <div>Loading activity...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error.message}</div>;
  }

  if (!recentActivity || recentActivity.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No recent activity found
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recentActivity.map((activity, index) => (
        <div key={activity.id || index} className="flex items-center justify-between py-2 border-b border-gray-100">
          <div>
            <div className="font-medium">{activity.description}</div>
            <div className="text-sm text-gray-600">{activity.type}</div>
          </div>
          <div className="text-sm text-gray-500">
            {new Date(activity.timestamp).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardDataExample;