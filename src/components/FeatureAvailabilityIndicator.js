import React from 'react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';

/**
 * Feature Availability Indicator - Shows if a feature is available or requires credits/upgrade
 */
const FeatureAvailabilityIndicator = ({ 
  featureName,
  showDetails = false,
  className = '',
  size = 'medium'
}) => {
  const { getFeatureStatus, isPro } = useFeatureAccess();
  const status = getFeatureStatus(featureName);

  if (!status.feature) {
    return null;
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'px-2 py-1 text-xs',
          icon: 'w-3 h-3',
          text: 'text-xs'
        };
      case 'large':
        return {
          container: 'px-4 py-2 text-base',
          icon: 'w-5 h-5',
          text: 'text-base'
        };
      default:
        return {
          container: 'px-3 py-1 text-sm',
          icon: 'w-4 h-4',
          text: 'text-sm'
        };
    }
  };

  const getStatusStyles = () => {
    if (isPro) {
      return {
        bg: 'bg-purple-100 border-purple-200',
        text: 'text-purple-800',
        icon: 'text-purple-600'
      };
    }

    if (status.available) {
      return {
        bg: 'bg-green-100 border-green-200',
        text: 'text-green-800',
        icon: 'text-green-600'
      };
    }

    return {
      bg: 'bg-red-100 border-red-200',
      text: 'text-red-800',
      icon: 'text-red-600'
    };
  };

  const sizeClasses = getSizeClasses();
  const statusStyles = getStatusStyles();

  const getStatusIcon = () => {
    if (isPro) {
      return (
        <svg className={sizeClasses.icon} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
        </svg>
      );
    }

    if (status.available) {
      return (
        <svg className={sizeClasses.icon} viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"/>
        </svg>
      );
    }

    return (
      <svg className={sizeClasses.icon} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/>
      </svg>
    );
  };

  const getStatusText = () => {
    if (isPro) {
      return 'Pro';
    }

    if (status.available) {
      return showDetails 
        ? `${status.requiredCredits} credit${status.requiredCredits > 1 ? 's' : ''}`
        : 'Available';
    }

    return showDetails 
      ? `Need ${status.requiredCredits} credit${status.requiredCredits > 1 ? 's' : ''}`
      : 'Unavailable';
  };

  return (
    <div className={`
      inline-flex items-center gap-2 border rounded-full
      ${sizeClasses.container}
      ${statusStyles.bg}
      ${statusStyles.text}
      ${className}
    `}>
      <div className={statusStyles.icon}>
        {getStatusIcon()}
      </div>
      
      <span className={`font-medium ${sizeClasses.text}`}>
        {getStatusText()}
      </span>

      {showDetails && !isPro && (
        <span className={`opacity-75 ${sizeClasses.text}`}>
          ({status.currentCredits} available)
        </span>
      )}
    </div>
  );
};

export default FeatureAvailabilityIndicator;