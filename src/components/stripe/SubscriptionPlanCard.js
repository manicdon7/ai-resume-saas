'use client';

import { useState } from 'react';

/**
 * A component to display subscription plan details with checkout button
 */
export default function SubscriptionPlanCard({
  planName = 'RoleFitAI Pro',
  price = 999,
  interval = 'month',
  features = [],
  onSubscribe,
  isPopular = false,
  isLoading = false,
}) {
  const [processing, setProcessing] = useState(false);

  const formatPrice = (priceInCents) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const handleSubscribe = async () => {
    if (processing || isLoading) return;
    
    setProcessing(true);
    try {
      if (onSubscribe) {
        await onSubscribe();
      }
    } catch (error) {
      console.error('Error initiating subscription:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className={`relative bg-card border rounded-2xl p-8 shadow-lg transition-all duration-300 hover:shadow-xl ${
      isPopular 
        ? 'border-primary ring-2 ring-primary/50 scale-105' 
        : 'border-border hover:border-primary/50'
    }`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-bold px-4 py-2 rounded-full shadow-lg">
            MOST POPULAR
          </div>
        </div>
      )}
      
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-foreground mb-2">{planName}</h3>
        
        <div className="mb-4">
          <span className="text-4xl font-bold gradient-text">{formatPrice(price)}</span>
          <span className="text-muted-foreground text-lg">/{interval}</span>
        </div>
      </div>
      
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-foreground">{feature}</span>
          </li>
        ))}
      </ul>
      
      <button
        onClick={handleSubscribe}
        disabled={processing || isLoading}
        className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 ${
          isPopular
            ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg hover:scale-[1.02]'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        } ${(processing || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {(processing || isLoading) ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
            Processing...
          </div>
        ) : (
          'Subscribe Now'
        )}
      </button>
    </div>
  );
}