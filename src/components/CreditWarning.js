import React, { useState } from 'react';
import { useCreditService } from '../hooks/useCreditService';

/**
 * Credit Warning Component - Shows warnings for low credit balances
 */
const CreditWarning = ({ 
  className = '',
  showUpgradeButton = true,
  dismissible = true,
  autoShow = true
}) => {
  const { 
    credits, 
    isPro, 
    getCreditWarningLevel,
    getCreditStatusMessage
  } = useCreditService();

  const [isDismissed, setIsDismissed] = useState(false);
  const warningLevel = getCreditWarningLevel();
  const statusMessage = getCreditStatusMessage();

  // Don't show if dismissed, pro user, or no warning needed
  if (isDismissed || isPro || warningLevel === 'normal' || warningLevel === 'none') {
    return null;
  }

  // Only auto-show for critical and warning levels
  if (autoShow && warningLevel !== 'critical' && warningLevel !== 'warning') {
    return null;
  }

  const getWarningConfig = () => {
    switch (warningLevel) {
      case 'critical':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-500',
          buttonColor: 'bg-red-600 hover:bg-red-700',
          title: 'No Credits Remaining',
          message: 'You\'ve used all your daily credits. Upgrade to Pro for unlimited access.',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L13.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
            </svg>
          )
        };
      case 'warning':
        return {
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800',
          iconColor: 'text-orange-500',
          buttonColor: 'bg-orange-600 hover:bg-orange-700',
          title: 'Low Credits',
          message: 'You only have 1 credit remaining. Consider upgrading to Pro.',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z"/>
            </svg>
          )
        };
      case 'low':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-500',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
          title: 'Credits Running Low',
          message: `You have ${credits} credits remaining. Plan ahead for your resume needs.`,
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/>
            </svg>
          )
        };
      default:
        return null;
    }
  };

  const config = getWarningConfig();
  if (!config) return null;

  const handleUpgrade = () => {
    // Navigate to pricing page
    window.location.href = '/pricing';
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className={`${config.iconColor} flex-shrink-0 mr-3 mt-0.5`}>
          {config.icon}
        </div>
        
        <div className="flex-1">
          <h3 className={`text-sm font-semibold ${config.textColor} mb-1`}>
            {config.title}
          </h3>
          <p className={`text-sm ${config.textColor} mb-3`}>
            {config.message}
          </p>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {showUpgradeButton && (
              <button
                onClick={handleUpgrade}
                className={`px-4 py-2 text-sm font-medium text-white ${config.buttonColor} rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-500`}
              >
                Upgrade to Pro
              </button>
            )}
            
            <button
              onClick={() => window.location.href = '/pricing'}
              className={`text-sm font-medium ${config.textColor} hover:underline`}
            >
              View Plans
            </button>
          </div>
          
          {/* Credit Reset Info */}
          {warningLevel === 'critical' && (
            <div className={`mt-3 text-xs ${config.textColor} opacity-75`}>
              💡 Free credits reset daily at midnight UTC
            </div>
          )}
        </div>
        
        {/* Dismiss Button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`${config.iconColor} hover:opacity-75 transition-opacity ml-2 flex-shrink-0`}
            aria-label="Dismiss warning"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default CreditWarning;