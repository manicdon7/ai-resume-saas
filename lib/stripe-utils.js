'use client';

/**
 * Utility functions for Stripe integration
 * Comprehensive payment processing utilities
 */

/**
 * Format a price amount from cents to a readable currency string
 * @param {number} amount - The amount in cents
 * @returns {string} Formatted currency string
 */
export const formatPrice = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100);
};

/**
 * Format a price with interval for display
 * @param {number} amount - The amount in cents
 * @param {string} interval - The billing interval (month, year)
 * @returns {string} Formatted price string
 */
export const formatPriceWithInterval = (amount, interval) => {
  const formatted = formatPrice(amount);
  return `${formatted}/${interval}`;
};

/**
 * Calculate savings between two pricing plans
 * @param {number} monthlyPrice - Monthly price in cents
 * @param {number} yearlyPrice - Yearly price in cents
 * @returns {Object} Savings information
 */
export const calculateSavings = (monthlyPrice, yearlyPrice) => {
  const monthlyTotal = monthlyPrice * 12;
  const savings = monthlyTotal - yearlyPrice;
  const savingsPercent = Math.round((savings / monthlyTotal) * 100);
  
  return {
    amount: savings,
    percent: savingsPercent,
    formatted: formatPrice(savings),
  };
};

/**
 * Redirect to Stripe Checkout or Customer Portal with the provided URL
 * @param {string} url - The Stripe checkout or portal URL
 */
export const redirectToCheckout = (url) => {
  if (!url) {
    console.error('No checkout URL provided');
    return;
  }
  
  // Ensure URL is valid
  try {
    new URL(url);
    window.location.href = url;
  } catch (error) {
    console.error('Invalid URL provided:', url);
  }
};

/**
 * Get comprehensive subscription details
 * @returns {Object} Complete subscription details with pricing tiers
 */
export const getSubscriptionDetails = () => {
  return {
    monthly: {
      id: 'price_monthly_pro',
      name: 'Monthly Pro',
      price: 999,
      formatted: '$9.99',
      interval: 'month',
      description: 'Perfect for short-term job search',
      features: [
        'Unlimited resume enhancements',
        'Priority processing',
        'Advanced ATS optimization',
        'Premium support',
        'Cancel anytime'
      ]
    },
    yearly: {
      id: 'price_yearly_pro',
      name: 'Yearly Pro',
      price: 9999,
      formatted: '$99.99',
      interval: 'year',
      description: 'Best value for long-term career growth',
      features: [
        'All Monthly Pro features',
        '2 months free (save $19.89)',
        'Priority customer support',
        'Early access to new features',
        'Annual billing discount'
      ]
    }
  };
};

/**
 * Validate Stripe price ID format
 * @param {string} priceId - The Stripe price ID to validate
 * @returns {boolean} Whether the price ID is valid
 */
export const isValidPriceId = (priceId) => {
  return /^price_[a-zA-Z0-9]+$/.test(priceId);
};

/**
 * Get supported payment methods
 * @returns {Array} List of supported payment methods
 */
export const getSupportedPaymentMethods = () => {
  return [
    'card',
    'paypal',
    'apple_pay',
    'google_pay',
    'bank_transfer'
  ];
};

/**
 * Generate secure transaction ID
 * @returns {string} Unique transaction ID
 */
export const generateTransactionId = () => {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if payment is in test mode
 * @returns {boolean} Whether in test mode
 */
export const isTestMode = () => {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_');
};

/**
 * Get receipt URL for a payment
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @returns {string} Receipt URL
 */
export const getReceiptUrl = (paymentIntentId) => {
  return `https://dashboard.stripe.com/${isTestMode() ? 'test/' : ''}payments/${paymentIntentId}`;
};

/**
 * Format subscription status for display
 * @param {string} status - Stripe subscription status
 * @returns {string} Formatted status
 */
export const formatSubscriptionStatus = (status) => {
  const statusMap = {
    active: 'Active',
    canceled: 'Canceled',
    past_due: 'Past Due',
    incomplete: 'Incomplete',
    incomplete_expired: 'Expired',
    trialing: 'Trial',
    unpaid: 'Unpaid'
  };
  
  return statusMap[status] || status;
};

/**
 * Calculate prorated amount for plan changes
 * @param {number} currentAmount - Current plan amount
 * @param {number} newAmount - New plan amount
 * @param {number} daysRemaining - Days remaining in current period
 * @param {number} totalDays - Total days in current period
 * @returns {number} Prorated amount
 */
export const calculateProratedAmount = (currentAmount, newAmount, daysRemaining, totalDays) => {
  const dailyRate = newAmount / totalDays;
  const unusedAmount = (currentAmount / totalDays) * daysRemaining;
  const newAmountForPeriod = dailyRate * daysRemaining;
  
  return Math.round(newAmountForPeriod - unusedAmount);
};

/**
 * Error handling utilities for Stripe operations
 */
export class StripeError extends Error {
  constructor(message, code, type) {
    super(message);
    this.name = 'StripeError';
    this.code = code;
    this.type = type;
  }
}

/**
 * Map Stripe error codes to user-friendly messages
 * @param {string} code - Stripe error code
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (code) => {
  const errorMessages = {
    card_declined: 'Your card was declined. Please try a different payment method.',
    insufficient_funds: 'Insufficient funds. Please try a different payment method.',
    expired_card: 'Your card has expired. Please check the expiration date.',
    incorrect_cvc: 'Your card\'s security code is incorrect.',
    processing_error: 'An error occurred while processing your payment. Please try again.',
    rate_limit: 'Too many requests. Please try again later.',
    authentication_required: 'Additional authentication is required for this payment.',
    generic_decline: 'Payment declined. Please contact your card issuer.',
  };
  
  return errorMessages[code] || 'An unexpected error occurred. Please try again.';
};

/**
 * Validate customer data before payment
 * @param {Object} customerData - Customer information
 * @returns {Object} Validation result
 */
export const validateCustomerData = (customerData) => {
  const errors = [];
  
  if (!customerData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
    errors.push('Valid email address is required');
  }
  
  if (!customerData.priceId || !isValidPriceId(customerData.priceId)) {
    errors.push('Valid price ID is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get subscription management portal URL
 * @param {string} customerId - Stripe customer ID
 * @returns {string} Portal URL
 */
export const getCustomerPortalUrl = (customerId) => {
  if (!customerId) {
    throw new StripeError('Customer ID is required', 'invalid_request', 'customer_id_missing');
  }
  
  return `/api/payment/create-portal?customer_id=${customerId}`;
};