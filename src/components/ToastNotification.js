/**
 * Toast Notification System
 * Provides success, error, warning, and info notifications
 */

import React, { useState, useEffect, createContext, useContext } from 'react';

// Toast types
export const ToastTypes = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Toast context
const ToastContext = createContext();

/**
 * Individual toast component
 */
const Toast = ({ toast, onRemove }) => {
  const { id, type, title, message, duration, actions } = toast;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onRemove(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onRemove]);

  const getToastStyles = () => {
    const baseStyles = "max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden";
    
    switch (type) {
      case ToastTypes.SUCCESS:
        return `${baseStyles} border-l-4 border-green-400`;
      case ToastTypes.ERROR:
        return `${baseStyles} border-l-4 border-red-400`;
      case ToastTypes.WARNING:
        return `${baseStyles} border-l-4 border-yellow-400`;
      case ToastTypes.INFO:
        return `${baseStyles} border-l-4 border-blue-400`;
      default:
        return `${baseStyles} border-l-4 border-gray-400`;
    }
  };

  const getIcon = () => {
    const iconClass = "h-6 w-6";
    
    switch (type) {
      case ToastTypes.SUCCESS:
        return (
          <svg className={`${iconClass} text-green-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case ToastTypes.ERROR:
        return (
          <svg className={`${iconClass} text-red-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case ToastTypes.WARNING:
        return (
          <svg className={`${iconClass} text-yellow-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case ToastTypes.INFO:
        return (
          <svg className={`${iconClass} text-blue-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={getToastStyles()}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            {title && (
              <p className="text-sm font-medium text-gray-900">
                {title}
              </p>
            )}
            {message && (
              <p className={`text-sm text-gray-500 ${title ? 'mt-1' : ''}`}>
                {message}
              </p>
            )}
            {actions && actions.length > 0 && (
              <div className="mt-3 flex space-x-2">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      action.onClick();
                      if (action.closeOnClick !== false) {
                        onRemove(id);
                      }
                    }}
                    className={`text-sm font-medium ${action.className || 'text-blue-600 hover:text-blue-500'}`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => onRemove(id)}
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
 * Toast container component
 */
const ToastContainer = ({ toasts, onRemove, position = 'top-right' }) => {
  const getPositionStyles = () => {
    const baseStyles = "fixed z-50 p-4 space-y-4";
    
    switch (position) {
      case 'top-right':
        return `${baseStyles} top-0 right-0`;
      case 'top-left':
        return `${baseStyles} top-0 left-0`;
      case 'bottom-right':
        return `${baseStyles} bottom-0 right-0`;
      case 'bottom-left':
        return `${baseStyles} bottom-0 left-0`;
      case 'top-center':
        return `${baseStyles} top-0 left-1/2 transform -translate-x-1/2`;
      case 'bottom-center':
        return `${baseStyles} bottom-0 left-1/2 transform -translate-x-1/2`;
      default:
        return `${baseStyles} top-0 right-0`;
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className={getPositionStyles()}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="transform transition-all duration-300 ease-in-out"
        >
          <Toast toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
};

/**
 * Toast provider component
 */
export const ToastProvider = ({ children, position = 'top-right', maxToasts = 5 }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      duration: 5000, // Default 5 seconds
      ...toast
    };

    setToasts(prevToasts => {
      const updatedToasts = [newToast, ...prevToasts];
      // Limit the number of toasts
      return updatedToasts.slice(0, maxToasts);
    });

    return id;
  };

  const removeToast = (id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  const showSuccess = (title, message, options = {}) => {
    return addToast({
      type: ToastTypes.SUCCESS,
      title,
      message,
      ...options
    });
  };

  const showError = (title, message, options = {}) => {
    return addToast({
      type: ToastTypes.ERROR,
      title,
      message,
      duration: 7000, // Errors stay longer
      ...options
    });
  };

  const showWarning = (title, message, options = {}) => {
    return addToast({
      type: ToastTypes.WARNING,
      title,
      message,
      ...options
    });
  };

  const showInfo = (title, message, options = {}) => {
    return addToast({
      type: ToastTypes.INFO,
      title,
      message,
      ...options
    });
  };

  const contextValue = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer 
        toasts={toasts} 
        onRemove={removeToast} 
        position={position}
      />
    </ToastContext.Provider>
  );
};

/**
 * Hook to use toast notifications
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
};

/**
 * Higher-order component to wrap components with toast functionality
 */
export const withToast = (Component) => {
  return function WrappedComponent(props) {
    const toast = useToast();
    return <Component {...props} toast={toast} />;
  };
};

/**
 * Utility functions for common toast patterns
 */
export const toastUtils = {
  // API operation feedback
  apiSuccess: (toast, operation = 'Operation') => {
    toast.showSuccess('Success', `${operation} completed successfully`);
  },

  apiError: (toast, error, operation = 'Operation') => {
    const message = error?.message || 'An unexpected error occurred';
    toast.showError('Error', `${operation} failed: ${message}`, {
      actions: [
        {
          label: 'Retry',
          onClick: () => window.location.reload(),
          className: 'text-red-600 hover:text-red-500'
        }
      ]
    });
  },

  // Form validation feedback
  validationError: (toast, message = 'Please check your input and try again') => {
    toast.showWarning('Validation Error', message);
  },

  // Network connectivity feedback
  networkError: (toast) => {
    toast.showError(
      'Connection Problem',
      'Please check your internet connection and try again',
      {
        duration: 0, // Don't auto-dismiss
        actions: [
          {
            label: 'Retry',
            onClick: () => window.location.reload()
          }
        ]
      }
    );
  },

  // Authentication feedback
  authError: (toast) => {
    toast.showError(
      'Authentication Required',
      'Please sign in to continue',
      {
        actions: [
          {
            label: 'Sign In',
            onClick: () => window.location.href = '/login'
          }
        ]
      }
    );
  },

  // Permission feedback
  permissionError: (toast) => {
    toast.showWarning(
      'Access Denied',
      'You don\'t have permission to perform this action'
    );
  }
};