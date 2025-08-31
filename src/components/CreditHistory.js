import React, { useState, useEffect } from 'react';
import { useCreditService } from '../hooks/useCreditService';

/**
 * Credit History Component - Shows transaction history with pagination
 */
const CreditHistory = ({ className = '', maxHeight = '400px' }) => {
  const { 
    creditHistory, 
    getCreditHistory, 
    loading, 
    error 
  } = useCreditService();

  const [currentPage, setCurrentPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 10;

  useEffect(() => {
    loadInitialHistory();
  }, []);

  const loadInitialHistory = async () => {
    try {
      const result = await getCreditHistory({ 
        limit: itemsPerPage, 
        skip: 0 
      });
      if (result) {
        setHasMore(result.hasMore);
      }
    } catch (err) {
      console.error('Failed to load credit history:', err);
    }
  };

  const loadMoreHistory = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const skip = (currentPage + 1) * itemsPerPage;
      const result = await getCreditHistory({ 
        limit: itemsPerPage, 
        skip 
      });
      
      if (result) {
        setCurrentPage(prev => prev + 1);
        setHasMore(result.hasMore);
      }
    } catch (err) {
      console.error('Failed to load more history:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'consume':
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13H5V11H19V13Z"/>
            </svg>
          </div>
        );
      case 'refill':
      case 'daily_reset':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
            </svg>
          </div>
        );
      case 'bonus':
      case 'purchase':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/>
            </svg>
          </div>
        );
    }
  };

  const getActionDescription = (action) => {
    switch (action) {
      case 'resume_parse': return 'Resume Enhancement';
      case 'job_search': return 'Job Search';
      case 'pdf_generation': return 'PDF Generation';
      case 'ats_analysis': return 'ATS Analysis';
      case 'cover_letter_generation': return 'Cover Letter';
      case 'daily_reset': return 'Daily Credit Reset';
      case 'manual_add': return 'Manual Credit Addition';
      case 'purchase': return 'Credit Purchase';
      case 'bonus': return 'Bonus Credits';
      default: return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (loading && (!creditHistory?.transactions || creditHistory?.transactions.length === 0)) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit History</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit History</h3>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/>
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadInitialHistory}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const transactions = creditHistory?.transactions || [];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Credit History</h3>
        <p className="text-sm text-gray-600 mt-1">
          Track your credit usage and transactions
        </p>
      </div>

      <div 
        className="overflow-y-auto"
        style={{ maxHeight }}
      >
        {transactions.length === 0 ? (
          <div className="text-center py-8 px-6">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/>
              </svg>
            </div>
            <p className="text-gray-600">No credit transactions yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Your credit usage will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map((transaction, index) => (
              <div key={transaction.id || index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-3">
                  {getTransactionIcon(transaction.type)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {getActionDescription(transaction.action)}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-semibold ${
                          transaction.type === 'consume' 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          {transaction.type === 'consume' ? '-' : '+'}
                          {transaction.amount}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(transaction.timestamp)}
                        </span>
                      </div>
                    </div>
                    
                    {transaction.metadata && (
                      <div className="mt-1">
                        {transaction.metadata.creditsRemaining !== undefined && (
                          <p className="text-xs text-gray-500">
                            {transaction.metadata.isPro 
                              ? 'Pro user - unlimited credits'
                              : `${transaction.metadata.creditsRemaining} credits remaining`
                            }
                          </p>
                        )}
                        
                        {transaction.metadata.userAgent && transaction.metadata.userAgent !== 'unknown' && (
                          <p className="text-xs text-gray-400 mt-1">
                            Device: {transaction.metadata.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && transactions.length > 0 && (
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={loadMoreHistory}
              disabled={loadingMore}
              className="w-full px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Loading more...
                </span>
              ) : (
                'Load More'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditHistory;