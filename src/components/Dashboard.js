'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Dashboard({ user }) {
  const [credits, setCredits] = useState(user?.credits || 0);
  const [isPro, setIsPro] = useState(user?.isPro || false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const response = await fetch('/api/user/credits', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setCredits(data.credits);
          setIsPro(data.isPro);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  if (!user) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-lg w-full max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
        <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-primary/30">
          {user.photoURL ? (
            <Image 
              src={user.photoURL} 
              alt={user.displayName || 'User'} 
              fill 
              className="object-cover" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {user.displayName || user.email?.split('@')[0]}
          </h2>
          <p className="text-muted-foreground">{user.email}</p>
          
          <div className="flex items-center gap-3 mt-2">
            {isPro ? (
              <span className="px-3 py-1 bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-bold rounded-full">
                PRO
              </span>
            ) : (
              <span className="px-3 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full">
                FREE
              </span>
            )}
            
            <span className="text-sm text-muted-foreground">
              {loading ? 'Loading...' : isPro ? 'Unlimited Access' : `${credits} credits remaining`}
            </span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-muted/50 rounded-xl p-6 border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Resume Enhancement</h3>
          <p className="text-muted-foreground mb-4">
            Enhance your resume with AI-powered suggestions tailored to specific job descriptions.
          </p>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {isPro ? 'Unlimited' : `${credits}/3 daily credits`}
            </span>
            {!isPro && (
              <div className="w-full max-w-[120px] h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-accent" 
                  style={{ width: `${Math.min(100, (credits / 3) * 100)}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-muted/50 rounded-xl p-6 border border-border hover:bg-muted/70 transition-colors cursor-pointer" onClick={() => window.location.href = '/analysis'}>
          <div className="absolute top-2 right-2 px-2 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full">
            {isPro ? 'Pro Features' : 'Basic + Pro Preview'}
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-4">ATS Optimizer</h3>
          <p className="text-muted-foreground">
            Analyze your resume against ATS systems and get detailed optimization recommendations.
          </p>
          <div className="mt-4 flex items-center text-primary text-sm font-medium">
            <span>Try ATS Analysis →</span>
          </div>
        </div>
        
        <div className="bg-muted/50 rounded-xl p-6 border border-border relative overflow-hidden">
          <div className="absolute top-2 right-2 px-2 py-1 bg-accent/20 text-accent text-xs font-medium rounded-full">
            Coming Soon
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Resume to Portfolio</h3>
          <p className="text-muted-foreground">
            Convert your resume into a professional online portfolio with just one click.
          </p>
        </div>
        
        <div className="bg-muted/50 rounded-xl p-6 border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Account Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="text-foreground font-medium">{isPro ? 'Pro' : 'Free'}</span>
            </div>
            {isPro && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Billing</span>
                <span className="text-foreground font-medium">$9.99/month</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Daily Credits</span>
              <span className="text-foreground font-medium">{isPro ? 'Unlimited' : '3'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}