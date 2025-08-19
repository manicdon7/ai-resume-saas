"use client";

import Link from 'next/link';

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-transparent to-accent/5 flex items-center justify-center p-4">
      <div className="bg-background/80 backdrop-blur-md rounded-xl border border-border/30 shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 mb-4 border border-border/50">
          <h1 className="text-3xl font-bold text-foreground">Payment Cancelled</h1>
        </div>
        
        <p className="text-muted-foreground mb-8">
          Your payment process was cancelled. No charges have been made to your account.
        </p>
        
        <div className="space-y-4">
          <Link 
            href="/"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 font-medium inline-block"
          >
            Return to Dashboard
          </Link>
          
          <div className="pt-4">
            <p className="text-muted-foreground text-sm">
              If you experienced any issues during the payment process, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}