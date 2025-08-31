import React, { useState } from 'react';
import { useCreditService } from '../hooks/useCreditService';

/**
 * Credit Protected Action Component - Wraps actions that require credits
 */
const CreditProtectedAction = ({ 
  children,
  action = 'general',
  requiredCredits = 1,
  onInsufficientCredits,
  showUpgradePrompt = true,
  className = '',
  disabled = false
}) => {
  const { 
    hasCredits, 
    isPro, 
    credits,
    validateCreditAction,
    getCreditWarningLevel
  } = useCreditService();

  const [isValidating, setIsValidating] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const canPerformAction = hasCredits(requiredCredits);
  const warningLevel = getCreditWarningLevel();

  const handleAction = async (originalOnClick) => {
    if (disabled) return;

    // Pro users can always perform actions
    if (isPro) {
      if (originalOnClick) {
        originalOnClick();
      }
      return;
    }

    // Validate credits before action
    setIsValidating(true);
    try {
      const validation = await validateCreditAction(action, requiredCredits);
      
      if (!validation.valid) {
        if (onInsufficientCredits) {
          onInsufficientCredits(validation);
        } else if (showUpgradePrompt) {
          setShowPrompt(true);
        }
        return;
      }

      // Proceed with action if validation passes
      if (originalOnClick) {
        originalOnClick();
      }
    } catch (error) {
      console.error('Credit validation failed:', error);
      if (onInsufficientCredits) {
        onInsufficientCredits({ valid: false, error: error.message });
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleUpgrade = () => {
    window.location.href = '/pricing';
  };

  const handleClosePrompt = () => {
    setShowPrompt(false);
  };

  // Clone children and add credit protection
  const protectedChildren = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      const originalOnClick = child.props.onClick;
      const isDisabled = disabled || !canPerformAction || isValidating;
      
      return React.cloneElement(child, {
        onClick: () => handleAction(originalOnClick),
        disabled: isDisabled,
        className: `${child.props.className || ''} ${
          !canPerformAction && !isPro ? 'opacity-50 cursor-not-allowed' : ''
        }`.trim(),
        title: !canPerformAction && !isPro 
          ? `Requires ${requiredCredits} credit${requiredCredits > 1 ? 's' : ''}. ${credits} remaining.`
          : child.props.title
      });
    }
    return child;
  });

  return (
    <div className={`relative ${className}`}>
      {protectedChildren}
      
      {/* Credit Warning Badge */}
      {!isPro && warningLevel !== 'normal' && warningLevel !== 'none' && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-xs text-white font-bold">!</span>
        </div>
      )}

      {/* Loading Indicator */}
      {isValidating && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        </div>
      )}

      {/* Insufficient Credits Prompt */}
      {showPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L13.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Insufficient Credits
              </h3>
              
              <p className="text-gray-600 mb-4">
                You need {requiredCredits} credit{requiredCredits > 1 ? 's' : ''} to perform this action.
                You currently have {credits} credit{credits !== 1 ? 's' : ''} remaining.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Free credits reset daily at midnight UTC, or upgrade to Pro for unlimited access.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleClosePrompt}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpgrade}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditProtectedAction;