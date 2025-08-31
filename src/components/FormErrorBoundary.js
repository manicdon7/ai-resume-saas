'use client';

import React from 'react';
import ErrorBoundary from './ErrorBoundary';

/**
 * Specialized error boundary for form components
 */
const FormErrorFallback = ({ error, errorInfo, onRetry }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Form Error
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>
              There was a problem with this form. Please try refreshing the page or contact support if the issue persists.
            </p>
          </div>
          <div className="mt-4">
            <div className="flex space-x-2">
              <button
                onClick={onRetry}
                className="bg-red-100 px-3 py-1 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-50"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-white px-3 py-1 rounded-md text-sm font-medium text-red-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-50 border border-red-200"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FormErrorBoundary = ({ children }) => {
  return (
    <ErrorBoundary fallback={FormErrorFallback}>
      {children}
    </ErrorBoundary>
  );
};

export default FormErrorBoundary;