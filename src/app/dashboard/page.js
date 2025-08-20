'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [userDataLoading, setUserDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchUserData(currentUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserData = async (currentUser) => {
    setUserDataLoading(true);
    try {
      const token = window.localStorage.getItem('token');
      
      const [creditsResponse, activityResponse] = await Promise.all([
        fetch('/api/user/credits', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch('/api/user/activity', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      ]);

      if (creditsResponse.ok) {
        const data = await creditsResponse.json();
        setCredits(data.credits);
        setIsPro(data.isPro);
      }

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData.activity || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
      setUserDataLoading(false);
    }
  };

  const refreshData = () => {
    if (user) {
      fetchUserData(user);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Please sign in</h2>
          <Link href="/" className="text-primary hover:underline">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Manage your account and track your progress</p>
        </div>

        {/* User Profile Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary/30">
              {user.photoURL ? (
                <Image 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  fill 
                  className="object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">
                {user.displayName || user.email?.split('@')[0]}
              </h2>
              <p className="text-muted-foreground mb-3">{user.email}</p>
              
              <div className="flex flex-wrap items-center gap-4">
                {isPro ? (
                  <span className="px-4 py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-bold rounded-full">
                    PRO MEMBER
                  </span>
                ) : (
                  <span className="px-4 py-2 bg-muted text-muted-foreground text-sm font-medium rounded-full">
                    FREE PLAN
                  </span>
                )}
                
                <button 
                  onClick={refreshData}
                  className="px-4 py-2 text-sm bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                  disabled={userDataLoading}
                >
                  {userDataLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold text-foreground">
                {userDataLoading ? '...' : credits}
              </div>
              <div className="text-sm text-muted-foreground">
                {isPro ? 'Unlimited Credits' : 'Credits Available'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-border mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: 'overview' },
              { id: 'activity', label: 'Recent Activity', icon: 'activity' },
              { id: 'settings', label: 'Settings', icon: 'settings' }
            ].map((tab) => {
              const getTabIcon = (iconType) => {
                switch (iconType) {
                  case 'overview':
                    return (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    );
                  case 'activity':
                    return (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    );
                  case 'settings':
                    return (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    );
                  default:
                    return null;
                }
              };
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {getTabIcon(tab.icon)}
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Features */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link href="/" className="p-4 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
                    <div className="text-primary text-lg mb-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="font-medium text-foreground">Enhance Resume</div>
                    <div className="text-sm text-muted-foreground">
                      {isPro ? 'Unlimited uses' : `${credits}/3 remaining`}
                    </div>
                  </Link>
                  
                  <Link href="/analysis" className="p-4 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
                    <div className="text-primary text-lg mb-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="font-medium text-foreground">ATS Optimizer</div>
                    <div className="text-sm text-muted-foreground">
                      {isPro ? 'Full analysis available' : 'Basic + Pro preview'}
                    </div>
                  </Link>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Usage Statistics</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Resume Enhancements</span>
                      <span className="text-foreground font-medium">{recentActivity.length}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-primary to-accent h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (recentActivity.length / 10) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Account Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Plan</span>
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Used Today</span>
                    <span className="text-foreground font-medium">{recentActivity.filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString()).length}</span>
                  </div>
                </div>
                
                {!isPro && (
                  <Link
                    href="/pricing"
                    className="mt-4 block w-full text-center px-4 py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Upgrade to Pro
                  </Link>
                )}
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Coming Soon</h3>
                <div className="space-y-3">
                  <Link href="/analysis" className="block p-3 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
                    <div className="font-medium text-foreground">Enhanced ATS Features</div>
                    <div className="text-sm text-muted-foreground">Advanced keyword analysis and section optimization</div>
                  </Link>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="font-medium text-foreground">Resume to Portfolio</div>
                    <div className="text-sm text-muted-foreground">Convert resume to online portfolio</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <div className="font-medium text-foreground">{activity.type}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {activity.details}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">
                  <svg className="w-16 h-16 mx-auto text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="text-muted-foreground">No recent activity</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Profile Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Display Name</label>
                  <input 
                    type="text" 
                    value={user.displayName || ''}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <input 
                    type="email" 
                    value={user.email || ''}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground"
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Account Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => auth.signOut()}
                  className="w-full px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}