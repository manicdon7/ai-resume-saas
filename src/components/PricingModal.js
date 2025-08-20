'use client';

import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { redirectToCheckout } from '../../lib/stripe-utils';

export default function PricingModal({ isOpen, onClose, user }) {
  const [processingPayment, setProcessingPayment] = useState(false);

  const handleUpgradeToPro = async () => {
    if (!user) {
      onClose();
      return;
    }

    setProcessingPayment(true);
    try {
      const response = await fetch('/api/payment/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      if (data.url) {
        redirectToCheckout(data.url);
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setProcessingPayment(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-card via-card to-accent/5 border border-border rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">RoleFitAI Pro</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-accent/10"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-8">
          <div className="text-center mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Upgrade to Pro</h3>
            <div className="mb-4">
              <span className="text-4xl sm:text-5xl font-bold text-foreground">$9.99</span>
              <span className="text-muted-foreground text-lg ml-1">/month</span>
            </div>
            <p className="text-sm text-muted-foreground">Billed monthly. Cancel anytime.</p>
          </div>

          <ul className="space-y-3 sm:space-y-4 mb-8">
            <li className="flex items-start gap-3 animate-fade-in" style={{animationDelay: '50ms'}}>
              <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-foreground text-sm sm:text-base">Unlimited resume enhancements</span>
            </li>
            <li className="flex items-start gap-3 animate-fade-in" style={{animationDelay: '100ms'}}>
              <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-foreground text-sm sm:text-base">Priority processing</span>
            </li>
            <li className="flex items-start gap-3 animate-fade-in" style={{animationDelay: '150ms'}}>
              <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-foreground text-sm sm:text-base">Advanced ATS optimization</span>
            </li>
            <li className="flex items-start gap-3 animate-fade-in" style={{animationDelay: '200ms'}}>
              <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-foreground text-sm sm:text-base">Premium support</span>
            </li>
            <li className="flex items-start gap-3 animate-fade-in" style={{animationDelay: '250ms'}}>
              <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-foreground text-sm sm:text-base">All premium templates</span>
            </li>
          </ul>
        </div>

        {processingPayment ? (
          <div className="py-4 text-center">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-muted-foreground">Initializing payment...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleUpgradeToPro}
              className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 active:bg-primary/95 font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                Upgrade to Pro
              </span>
            </button>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-muted text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/80 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-muted focus:ring-offset-2"
            >
              Maybe Later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}