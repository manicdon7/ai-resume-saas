import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setCredits, 
  addCreditTransaction, 
  setCreditHistory, 
  setCreditHistoryLoading, 
  setCreditHistoryError,
  consumeCredit,
  addCredits as addCreditsAction,
  updateCreditBalance
} from '../store/slices/authSlice';

/**
 * Custom hook for credit management with real-time tracking
 */
export const useCreditService = () => {
  const dispatch = useDispatch();
  const { 
    credits, 
    isPro, 
    creditTransactions, 
    creditHistory, 
    isAuthenticated 
  } = useSelector(state => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get current credit balance
   */
  const getCurrentCredits = useCallback(async () => {
    if (!isAuthenticated) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/user/credits', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get credits');
      }

      dispatch(setCredits(data.unlimited ? 'unlimited' : data.credits));
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, dispatch]);

  /**
   * Validate if user can perform an action
   */
  const validateCreditAction = useCallback(async (action, requiredCredits = 1) => {
    if (!isAuthenticated) {
      return { valid: false, error: 'Not authenticated' };
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/credits/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, requiredCredits })
      });

      const data = await response.json();
      return data;
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }, [isAuthenticated]);

  /**
   * Consume credits for an action
   */
  const consumeCredits = useCallback(async (action, amount = 1) => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }

    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/credits/consume', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, amount })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to consume credits');
      }

      // Update Redux state
      dispatch(consumeCredit({
        amount,
        action,
        transaction: data.transaction
      }));

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, dispatch]);

  /**
   * Get credit transaction history
   */
  const getCreditHistory = useCallback(async (options = {}) => {
    if (!isAuthenticated) return null;
    
    try {
      dispatch(setCreditHistoryLoading(true));
      
      const token = localStorage.getItem('authToken');
      const queryParams = new URLSearchParams(options).toString();
      const response = await fetch(`/api/credits/history?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get credit history');
      }

      dispatch(setCreditHistory(data.transactions));
      return data;
    } catch (err) {
      dispatch(setCreditHistoryError(err.message));
      return null;
    }
  }, [isAuthenticated, dispatch]);

  /**
   * Check if user has sufficient credits
   */
  const hasCredits = useCallback((requiredCredits = 1) => {
    if (isPro) return true;
    if (typeof credits === 'string' && credits === 'unlimited') return true;
    return credits >= requiredCredits;
  }, [credits, isPro]);

  /**
   * Get credit status message
   */
  const getCreditStatusMessage = useCallback(() => {
    if (isPro) return 'Unlimited credits (Pro user)';
    if (typeof credits === 'string' && credits === 'unlimited') return 'Unlimited credits';
    if (credits === 0) return 'No credits remaining';
    if (credits === 1) return '1 credit remaining';
    return `${credits} credits remaining`;
  }, [credits, isPro]);

  /**
   * Get credit warning level
   */
  const getCreditWarningLevel = useCallback(() => {
    if (isPro) return 'none';
    if (typeof credits === 'string') return 'none';
    if (credits === 0) return 'critical';
    if (credits <= 1) return 'warning';
    if (credits <= 2) return 'low';
    return 'normal';
  }, [credits, isPro]);

  /**
   * Refresh credit balance from server
   */
  const refreshCredits = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/credits/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to refresh credits');
      }

      dispatch(updateCreditBalance({
        credits: data.credits,
        isPro: data.isPro
      }));

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  return {
    // State
    credits,
    isPro,
    creditTransactions,
    creditHistory,
    loading,
    error,
    
    // Actions
    getCurrentCredits,
    validateCreditAction,
    consumeCredits,
    getCreditHistory,
    refreshCredits,
    
    // Utilities
    hasCredits,
    getCreditStatusMessage,
    getCreditWarningLevel,
    
    // Clear error
    clearError: () => setError(null)
  };
};

export default useCreditService;