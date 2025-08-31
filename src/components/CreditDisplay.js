import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useCreditService } from '../hooks/useCreditService';

/**
 * Credit Display Component - Shows current credit balance with real-time updates
 */
const CreditDisplay = ({ 
  showDetails = false, 
  showWarnings = true, 
  className = '',
  size = 'medium' 
}) => {
  const { 
    credits, 
    isPro, 
    loading, 
    error,
    getCreditStatusMessage,
    getCreditWarningLevel,
    refreshCredits,
    clearError
  } = useCreditService();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const warningLevel = getCreditWarningLevel();
  const statusMessage = getCreditStatusMessage();

  // Auto-refresh credits every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await refreshCredits();
        setLastRefresh(new Date());
      } catch (err) {
        console.error('Auto-refresh failed:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshCredits]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshCredits();
      setLastRefresh(new Date());
      clearError();
    } catch (err) {
      console.error('Manual refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getWarningColor = () => {
    switch (warningLevel) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getIconColor = () => {
    switch (warningLevel) {
      case 'critical': return 'text-red-500';
      case 'warning': return 'text-orange-500';
      case 'low': return 'text-yellow-500';
      default: return 'text-green-500';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'px-2 py-1 text-sm',
          icon: 'w-4 h-4',
          text: 'text-sm'
        };
      case 'large':
        return {
          container: 'px-6 py-4 text-lg',
          icon: 'w-6 h-6',
          text: 'text-lg'
        };
      default:
        return {
          container: 'px-4 py-2 text-base',
          icon: 'w-5 h-5',
          text: 'text-base'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  if (loading && !credits) {
    return (
      <div className={`inline-flex items-center ${sizeClasses.container} bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
        <span className={`${sizeClasses.text} text-gray-600`}>Loading credits...</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${sizeClasses.container} ${getWarningColor()} border rounded-lg ${className}`}>
      {/* Credit Icon */}
      <div className={`${sizeClasses.icon} ${getIconColor()} mr-2 flex-shrink-0`}>
        {isPro ? (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V19C3 20.1 3.9 21 5 21H11V19H5V3H13V9H21Z"/>
          </svg>
        )}
      </div>

      {/* Credit Count */}
      <div className="flex-1">
        <div className={`font-semibold ${sizeClasses.text}`}>
          {isPro ? (
            <span className="flex items-center">
              <span className="text-purple-600">∞</span>
              <span className="ml-1 text-purple-600">Pro</span>
            </span>
          ) : (
            <span>
              {typeof credits === 'string' && credits === 'unlimited' ? '∞' : credits}
              <span className="ml-1 font-normal">
                {credits === 1 ? 'credit' : 'credits'}
              </span>
            </span>
          )}
        </div>
        
        {showDetails && (
          <div className={`${sizeClasses.text === 'text-lg' ? 'text-sm' : 'text-xs'} opacity-75 mt-1`}>
            {statusMessage}
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={`ml-2 ${sizeClasses.icon} text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50`}
        title="Refresh credit balance"
      >
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className={isRefreshing ? 'animate-spin' : ''}
        >
          <path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4a9 9 0 0 1-14.85 4.36L23 14"/>
        </svg>
      </button>

      {/* Warning Indicator */}
      {showWarnings && warningLevel !== 'normal' && warningLevel !== 'none' && (
        <div className={`ml-2 ${sizeClasses.icon} flex-shrink-0`}>
          {warningLevel === 'critical' && (
            <svg viewBox="0 0 24 24" fill="currentColor" className="text-red-500">
              <path d="M12 2L13.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
            </svg>
          )}
          {warningLevel === 'warning' && (
            <svg viewBox="0 0 24 24" fill="currentColor" className="text-orange-500">
              <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z"/>
            </svg>
          )}
          {warningLevel === 'low' && (
            <svg viewBox="0 0 24 24" fill="currentColor" className="text-yellow-500">
              <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/>
            </svg>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="ml-2 text-red-500" title={error}>
          <svg viewBox="0 0 24 24" fill="currentColor" className={sizeClasses.icon}>
            <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/>
          </svg>
        </div>
      )}

      {/* Last Refresh Indicator */}
      {showDetails && lastRefresh && (
        <div className={`ml-2 ${sizeClasses.text === 'text-lg' ? 'text-xs' : 'text-xs'} text-gray-400`}>
          Updated {new Date(lastRefresh).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default CreditDisplay;