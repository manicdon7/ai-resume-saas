'use client';

import React from 'react';
import ErrorBoundary from './ErrorBoundary';

/**
 * Specialized error boundary for dashboard components
 */
const DashboardErrorFallback = ({ error, errorInfo, onRetry }) => {
  return (
    <div className="min-h-[400px] flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
      <div className="text-center p-8 max-w-md">
        <div className="mx-auto h-16 w-16 text-red-500 mb-4">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Dashboard Unavailable
        </h3>
        
        <p className="text-gray-600 mb-6">
          We're having trouble loading your dashboard data. This might be a temporary issue.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Refresh Page
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-4">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
};

const DashboardErrorBoundary = ({ children }) => {
  return (
    <ErrorBoundary fallback={DashboardErrorFallback}>
      {children}
    </ErrorBoundary>
  );
};

export default DashboardErrorBoundary;