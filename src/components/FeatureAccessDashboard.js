import React from 'react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import FeatureAvailabilityIndicator from './FeatureAvailabilityIndicator';
import { motion } from 'framer-motion';

/**
 * Feature Access Dashboard - Shows all features and their availability status
 */
const FeatureAccessDashboard = ({ className = '' }) => {
  const {
    features,
    getAllFeatureStatuses,
    getUpgradeRecommendation,
    isPro,
    credits
  } = useFeatureAccess();

  const featureStatuses = getAllFeatureStatuses();
  const upgradeRec = getUpgradeRecommendation();

  const getFeatureIcon = (featureName) => {
    const icons = {
      resumeEnhancement: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" />
        </svg>
      ),
      atsAnalysis: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" />
        </svg>
      ),
      coverLetterGeneration: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" />
        </svg>
      ),
      pdfGeneration: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" />
        </svg>
      ),
      jobSearch: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 6H16V4C16 2.89 15.11 2 14 2H10C8.89 2 8 2.89 8 4V6H4C2.89 6 2.01 6.89 2.01 8L2 19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V8C22 6.89 21.11 6 20 6ZM14 6H10V4H14V6Z" />
        </svg>
      ),
      bulkOperations: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM17 12H7V10H17V12ZM17 16H7V14H17V16ZM17 8H7V6H17V8Z" />
        </svg>
      )
    };
    return icons[featureName] || (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" />
      </svg>
    );
  };

  const handleUpgrade = () => {
    window.location.href = '/pricing';
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Feature Access</h3>
            <p className="text-sm text-gray-600 mt-1">
              {isPro
                ? 'Pro user - unlimited access to all features'
                : `${credits} credits remaining`
              }
            </p>
          </div>

          {!isPro && (
            <button
              onClick={handleUpgrade}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Upgrade to Pro
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(features).map(([featureName, feature], index) => {
            const status = featureStatuses[featureName];

            return (
              <motion.div
                key={featureName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`p-4 border rounded-lg transition-all duration-200 ${status.available
                  ? 'border-green-200 bg-green-50 hover:bg-green-100'
                  : 'border-red-200 bg-red-50 hover:bg-red-100'
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`${status.available ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {getFeatureIcon(featureName)}
                    </div>

                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {feature.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {feature.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {feature.requiredCredits} credit{feature.requiredCredits > 1 ? 's' : ''} required
                        </span>

                        <FeatureAvailabilityIndicator
                          featureName={featureName}
                          showDetails={false}
                          size="small"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {!status.available && status.canUpgrade && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-xs text-red-600 mb-2">
                      {status.reason}
                    </p>
                    <button
                      onClick={handleUpgrade}
                      className="text-xs text-red-700 hover:text-red-800 font-medium underline"
                    >
                      Upgrade for unlimited access
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Upgrade Recommendation */}
        {upgradeRec.shouldUpgrade && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            className={`mt-6 p-4 rounded-lg border ${upgradeRec.urgency === 'high'
              ? 'bg-red-50 border-red-200'
              : upgradeRec.urgency === 'medium'
                ? 'bg-orange-50 border-orange-200'
                : 'bg-blue-50 border-blue-200'
              }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className={`font-medium mb-1 ${upgradeRec.urgency === 'high'
                  ? 'text-red-800'
                  : upgradeRec.urgency === 'medium'
                    ? 'text-orange-800'
                    : 'text-blue-800'
                  }`}>
                  {upgradeRec.urgency === 'high' ? '🚨 Upgrade Recommended' :
                    upgradeRec.urgency === 'medium' ? '⚠️ Consider Upgrading' :
                      '💡 Upgrade Available'}
                </h4>
                <p className={`text-sm mb-3 ${upgradeRec.urgency === 'high'
                  ? 'text-red-700'
                  : upgradeRec.urgency === 'medium'
                    ? 'text-orange-700'
                    : 'text-blue-700'
                  }`}>
                  {upgradeRec.reason}
                </p>

                {upgradeRec.benefits && (
                  <ul className={`text-xs space-y-1 ${upgradeRec.urgency === 'high'
                    ? 'text-red-600'
                    : upgradeRec.urgency === 'medium'
                      ? 'text-orange-600'
                      : 'text-blue-600'
                    }`}>
                    {upgradeRec.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center">
                        <span className="mr-2">✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                onClick={handleUpgrade}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${upgradeRec.urgency === 'high'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : upgradeRec.urgency === 'medium'
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
              >
                Upgrade Now
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FeatureAccessDashboard;