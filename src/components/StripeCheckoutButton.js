'use client';

import { useState } from 'react';
import { redirectToCheckout, formatPrice } from '../../lib/stripe-utils';

/**
 * A reusable Stripe checkout button component
 * 
 * @param {Object} props
 * @param {string} props.buttonText - Text to display on the button
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onCheckout - Function to call when checkout is initiated
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {number} props.price - Price to display (in cents)
 * @param {boolean} props.showPrice - Whether to show the price
 * @param {string} props.priceText - Text to display before the price
 */
export default function StripeCheckoutButton({
  buttonText = 'Upgrade to Pro',
  className = '',
  onCheckout,
  disabled = false,
  price = 999,
  showPrice = true,
  priceText = 'Only',
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Call the provided onCheckout function
      if (onCheckout) {
        await onCheckout();
      }
    } catch (error) {
      console.error('Error initiating checkout:', error);
      alert('There was an error initiating checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {showPrice && (
        <div className="text-sm mb-2">
          {priceText} {formatPrice(price)}/month
        </div>
      )}
      
      <button
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors 
          flex items-center justify-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          <>
            {buttonText}
          </>
        )}
      </button>
    </div>
  );
}