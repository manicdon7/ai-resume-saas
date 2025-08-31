import React from 'react';
import { useCreditService } from '../hooks/useCreditService';

/**
 * Credit Usage Indicator - Shows credit usage as a progress bar
 */
const CreditUsageIndicator = ({ 
  className = '',
  showLabel = true,
  showPercentage = true,
  maxCredits = 3, // Daily limit for free users
  size = 'medium'
}) => {
  const { 
    credits, 
    isPro, 
    getCreditWarningLevel
  } = useCreditService();

  const warningLevel = getCreditWarningLevel();

  // Pro users don't need usage indicators
  if (isPro) {
    return showLabel ? (
      <div className={`flex items-center ${className}`}>
        <div className="flex items-center text-purple-600">
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
          </svg>
          <span className="font-semibold">Pro - Unlimited Credits</span>
        </div>
      </div>
    ) : null;
  }

  const currentCredits = typeof credits === 'number' ? credits : 0;
  const usedCredits = maxCredits - currentCredits;
  const usagePercentage = Math.min(100, (usedCredits / maxCredits) * 100);
  const remainingPercentage = Math.max(0, (currentCredits / maxCredits) * 100);

  const getBarColor = () => {
    switch (warningLevel) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-orange-500';
      case 'low': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getBackgroundColor = () => {
    switch (warningLevel) {
      case 'critical': return 'bg-red-100';
      case 'warning': return 'bg-orange-100';
      case 'low': return 'bg-yellow-100';
      default: return 'bg-green-100';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          height: 'h-2',
          text: 'text-xs',
          spacing: 'space-y-1'
        };
      case 'large':
        return {
          height: 'h-4',
          text: 'text-base',
          spacing: 'space-y-3'
        };
      default:
        return {
          height: 'h-3',
          text: 'text-sm',
          spacing: 'space-y-2'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={`${sizeClasses.spacing} ${className}`}>
      {/* Label */}
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className={`font-medium text-gray-700 ${sizeClasses.text}`}>
            Daily Credit Usage
          </span>
          {showPercentage && (
            <span className={`${sizeClasses.text} text-gray-500`}>
              {currentCredits}/{maxCredits} remaining
            </span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="relative">
        <div className={`w-full ${sizeClasses.height} ${getBackgroundColor()} rounded-full overflow-hidden`}>
          <div 
            className={`${sizeClasses.height} ${getBarColor()} rounded-full transition-all duration-300 ease-in-out`}
            style={{ width: `${usagePercentage}%` }}
          />
        </div>
        
        {/* Percentage Label on Bar */}
        {showPercentage && size !== 'small' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`${sizeClasses.text} font-medium text-white mix-blend-difference`}>
              {Math.round(usagePercentage)}% used
            </span>
          </div>
        )}
      </div>

      {/* Status Text */}
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className={`${sizeClasses.text} text-gray-500`}>
            {usedCredits} of {maxCredits} credits used today
          </span>
          
          {warningLevel !== 'normal' && warningLevel !== 'none' && (
            <span className={`${sizeClasses.text} font-medium ${
              warningLevel === 'critical' ? 'text-red-600' :
              warningLevel === 'warning' ? 'text-orange-600' :
              'text-yellow-600'
            }`}>
              {warningLevel === 'critical' ? 'Limit reached' :
               warningLevel === 'warning' ? 'Almost full' :
               'Getting full'}
            </span>
          )}
        </div>
      )}

      {/* Reset Info */}
      {currentCredits === 0 && (
        <div className={`${sizeClasses.text} text-gray-400 italic`}>
          Credits reset daily at midnight UTC
        </div>
      )}
    </div>
  );
};

export default CreditUsageIndicator;