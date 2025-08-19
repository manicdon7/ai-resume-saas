"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function PaymentSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (sessionId) {
      // Update local state
      const token = window.localStorage.getItem('token');
      if (token) {
        // Verify payment status with backend
        fetch('/api/payment/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ sessionId })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            toast.success('Pro upgrade successful!');
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Payment verification error:', err);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-transparent to-accent/5 flex items-center justify-center p-4">
      <div className="bg-background/80 backdrop-blur-md rounded-xl border border-border/30 shadow-lg p-8 max-w-md w-full text-center">
        {loading ? (
          <div className="py-8">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <p className="text-white mt-4">Verifying your payment...</p>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-foreground mb-4">Payment Successful!</h1>
            
            <p className="text-muted-foreground mb-8">
              Thank you for upgrading to RoleFitAI Pro! You now have unlimited access to all our premium features.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 mb-8 border border-border/50">
              <h2 className="text-xl font-semibold text-foreground mb-2">Pro Benefits</h2>
              <ul className="text-muted-foreground text-left space-y-2">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited resume enhancements
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Priority processing
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Advanced ATS optimization
                </li>
              </ul>
            </div>
            
            <Link 
              href="/"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 font-medium inline-block"
            >
              Return to Dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  );
}