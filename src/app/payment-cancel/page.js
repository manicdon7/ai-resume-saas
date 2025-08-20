"use client";

import Link from 'next/link';

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-transparent to-accent/5 flex items-center justify-center p-4">
      <div className="bg-background/80 backdrop-blur-md rounded-xl border border-border/30 shadow-lg p-8 max-w-md w-full text-center transform transition-all duration-300 hover:scale-105">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20 animate-pulse">
          <svg className="w-10 h-10 text-red-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-foreground mb-4 animate-fade-in">Payment Cancelled</h1>
        
        <p className="text-muted-foreground mb-8 animate-fade-in-delay">
          Your payment process was cancelled. No charges have been made to your account.
        </p>
        
        <div className="bg-muted/50 rounded-lg p-6 mb-8 border border-border/50 transform transition-all duration-300 hover:scale-105">
          <h2 className="text-lg font-semibold text-foreground mb-3">What happened?</h2>
          <ul className="text-muted-foreground text-left space-y-2 text-sm">
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Payment was cancelled by user</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>No charges were processed</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>You can retry anytime</span>
            </li>
          </ul>
        </div>
        
        <div className="flex gap-4 justify-center">
          <Link 
            href="/pricing"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 font-medium inline-block transform hover:scale-105 hover:shadow-lg"
          >
            Try Again
          </Link>
          <Link 
            href="/dashboard"
            className="px-6 py-3 border border-border text-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200 font-medium inline-block transform hover:scale-105"
          >
            Dashboard
          </Link>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Need help? <a href="/contact" className="text-primary hover:underline">Contact Support</a>
          </p>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-fade-in-delay {
          animation: fade-in 0.6s ease-out 0.2s forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}