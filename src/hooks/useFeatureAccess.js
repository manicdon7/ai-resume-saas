import { useMemo } from 'react';
import { useCreditService } from './useCreditService';

/**
 * Hook for managing feature access based on credits and pro status
 */
export const useFeatureAccess = () => {
  const { 
    credits, 
    isPro, 
    hasCredits,
    getCreditWarningLevel,
    validateCreditAction
  } = useCreditService();

  // Feature definitions with credit requirements
  const features = useMemo(() => ({
    resumeEnhancement: {
      name: 'Resume Enhancement',
      requiredCredits: 1,
      action: 'resume_parse',
      description: 'AI-powered resume optimization'
    },
    atsAnalysis: {
      name: 'ATS Analysis',
      requiredCredits: 1,
      action: 'ats_analysis',
      description: 'Applicant Tracking System compatibility check'
    },
    coverLetterGeneration: {
      name: 'Cover Letter Generation',
      requiredCredits: 1,
      action: 'cover_letter_generation',
      description: 'AI-generated personalized cover letters'
    },
    pdfGeneration: {
      name: 'PDF Generation',
      requiredCredits: 1,
      action: 'pdf_generation',
      description: 'Professional PDF document creation'
    },
    jobSearch: {
      name: 'Job Search',
      requiredCredits: 1,
      action: 'job_search',
      description: 'AI-powered job matching and search'
    },
    bulkOperations: {
      name: 'Bulk Operations',
      requiredCredits: 3,
      action: 'bulk_operations',
      description: 'Process multiple resumes or applications'
    }
  }), []);

  /**
   * Check if a feature is available
   */
  const isFeatureAvailable = (featureName) => {
    if (isPro) return true;
    
    const feature = features[featureName];
    if (!feature) return false;
    
    return hasCredits(feature.requiredCredits);
  };

  /**
   * Get feature availability status with details
   */
  const getFeatureStatus = (featureName) => {
    const feature = features[featureName];
    if (!feature) {
      return {
        available: false,
        reason: 'Feature not found',
        canUpgrade: false
      };
    }

    if (isPro) {
      return {
        available: true,
        reason: 'Pro user - unlimited access',
        canUpgrade: false,
        feature
      };
    }

    const available = hasCredits(feature.requiredCredits);
    
    return {
      available,
      reason: available 
        ? `${feature.requiredCredits} credit${feature.requiredCredits > 1 ? 's' : ''} required`
        : `Insufficient credits (need ${feature.requiredCredits}, have ${credits})`,
      canUpgrade: !available,
      feature,
      requiredCredits: feature.requiredCredits,
      currentCredits: credits
    };
  };

  /**
   * Get all features with their availability status
   */
  const getAllFeatureStatuses = () => {
    return Object.keys(features).reduce((acc, featureName) => {
      acc[featureName] = getFeatureStatus(featureName);
      return acc;
    }, {});
  };

  /**
   * Get features that are currently unavailable
   */
  const getUnavailableFeatures = () => {
    return Object.keys(features).filter(featureName => !isFeatureAvailable(featureName));
  };

  /**
   * Get features that are available
   */
  const getAvailableFeatures = () => {
    return Object.keys(features).filter(featureName => isFeatureAvailable(featureName));
  };

  /**
   * Calculate total credits needed for all unavailable features
   */
  const getCreditsNeededForAllFeatures = () => {
    if (isPro) return 0;
    
    const unavailable = getUnavailableFeatures();
    return unavailable.reduce((total, featureName) => {
      const feature = features[featureName];
      return total + (feature.requiredCredits - credits);
    }, 0);
  };

  /**
   * Get upgrade recommendations based on usage patterns
   */
  const getUpgradeRecommendation = () => {
    const warningLevel = getCreditWarningLevel();
    const unavailableCount = getUnavailableFeatures().length;
    
    if (isPro) {
      return {
        shouldUpgrade: false,
        reason: 'Already Pro user',
        urgency: 'none'
      };
    }

    if (warningLevel === 'critical') {
      return {
        shouldUpgrade: true,
        reason: 'No credits remaining',
        urgency: 'high',
        benefits: ['Unlimited access to all features', 'No daily limits', 'Priority support']
      };
    }

    if (warningLevel === 'warning' || unavailableCount > 2) {
      return {
        shouldUpgrade: true,
        reason: 'Limited credits affecting multiple features',
        urgency: 'medium',
        benefits: ['Unlimited feature access', 'No waiting for credit resets']
      };
    }

    if (unavailableCount > 0) {
      return {
        shouldUpgrade: true,
        reason: 'Some features unavailable',
        urgency: 'low',
        benefits: ['Access to all premium features']
      };
    }

    return {
      shouldUpgrade: false,
      reason: 'All features currently available',
      urgency: 'none'
    };
  };

  /**
   * Validate feature access before performing action
   */
  const validateFeatureAccess = async (featureName) => {
    const feature = features[featureName];
    if (!feature) {
      return {
        valid: false,
        error: 'Feature not found'
      };
    }

    if (isPro) {
      return {
        valid: true,
        isPro: true,
        message: 'Pro user access'
      };
    }

    return await validateCreditAction(feature.action, feature.requiredCredits);
  };

  return {
    // Feature definitions
    features,
    
    // Availability checks
    isFeatureAvailable,
    getFeatureStatus,
    getAllFeatureStatuses,
    getAvailableFeatures,
    getUnavailableFeatures,
    
    // Credit calculations
    getCreditsNeededForAllFeatures,
    
    // Upgrade recommendations
    getUpgradeRecommendation,
    
    // Validation
    validateFeatureAccess,
    
    // Current state
    isPro,
    credits,
    warningLevel: getCreditWarningLevel()
  };
};

export default useFeatureAccess;