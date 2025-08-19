'use client';

/**
 * Utility functions for Stripe integration
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
 * Redirect to Stripe Checkout with the provided URL
 * @param {string} checkoutUrl - The Stripe checkout URL
 */
export const redirectToCheckout = (checkoutUrl) => {
  if (!checkoutUrl) {
    console.error('No checkout URL provided');
    return;
  }
  
  window.location.href = checkoutUrl;
};

/**
 * Get subscription details
 * @returns {Object} Subscription details
 */
export const getSubscriptionDetails = () => {
  return {
    name: 'RoleFitAI Pro',
    price: 999, // in cents
    interval: 'month',
    features: [
      'Unlimited resume enhancements',
      'Priority processing',
      'Advanced ATS optimization',
      'Premium support'
    ]
  };
};