'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, Sparkles, Star } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import Navbar from '@/components/Navbar';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Utility function to redirect to checkout
const redirectToCheckout = (url) => {
  if (url) {
    window.location.href = url;
  }
};

const pricingPlans = [
  {
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    description: 'Perfect for getting started with basic resume building',
    features: [
      'Basic resume templates',
      '1 resume creation',
      'Standard formatting',
      'PDF export',
      'Basic ATS optimization'
    ],
    cta: 'Get Started',
    popular: false,
    comingSoon: [],
    priceIdMonthly: null,
    priceIdYearly: null
  },
  {
    name: 'Pro',
    price: { monthly: 9.99, yearly: 7.99 },
    description: 'Ideal for professionals seeking advanced features',
    features: [
      'All premium templates',
      'Unlimited resume creation',
      'Advanced ATS optimization',
      'Cover letter generator',
      'LinkedIn integration',
      'Real-time preview',
      'Priority support'
    ],
    cta: 'Start Pro Trial',
    popular: true,
    comingSoon: ['AI-powered suggestions', 'Portfolio generator'],
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY,
    priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY
  },
  {
    name: 'Enterprise',
    price: { monthly: 19.99, yearly: 15.99 },
    description: 'For teams and power users with advanced needs',
    features: [
      'Everything in Pro',
      'Team collaboration',
      'Custom branding',
      'API access',
      'Advanced analytics',
      'Dedicated support',
      'Bulk resume processing'
    ],
    cta: 'Contact Sales',
    popular: false,
    comingSoon: ['White-label solution', 'Custom integrations'],
    priceIdMonthly: null,
    priceIdYearly: null
  }
];

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [loading, setLoading] = useState({});
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleCheckout = async (planName, planType) => {
    const plan = pricingPlans.find(p => p.name === planName);
    if (!plan || !plan[`priceId${planType.charAt(0).toUpperCase() + planType.slice(1)}`]) {
      setError('Invalid plan selected');
      return;
    }

    setLoading(prev => ({ ...prev, [`${planName}-${planType}`]: true }));
    setError(null);

    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        router.push('/login');
        return;
      }

      // Create checkout session
      const response = await fetch('/api/payment/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          priceId: plan[`priceId${planType.charAt(0).toUpperCase() + planType.slice(1)}`],
          planType: planType,
          planName: planName,
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data = await response.json();
      
      if (data.url) {
        redirectToCheckout(data.url);
      } else if (data.sessionId) {
        // Legacy Stripe Checkout
        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
        if (error) {
          throw new Error(error.message);
        }
      } else {
        throw new Error('No checkout URL provided');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'An error occurred during checkout');
      setLoading(prev => ({ ...prev, [`${planName}-${planType}`]: false }));
    }
  };

  const handleAuthRedirect = () => {
    localStorage.setItem('redirectAfterLogin', window.location.pathname);
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-blue-900/10 to-black" />
        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10">
        <Navbar user={user} onSignOut={handleSignOut} />
        <div className="container mx-auto px-4 py-12 sm:py-16">
          {/* Header */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1 
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4 animate-gradient-shine"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Choose Your Plan
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-300 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Unlock your career potential with our AI-powered resume tools
            </motion.p>
          </motion.div>

          {/* Billing Toggle */}
          <motion.div 
            className="flex items-center justify-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <motion.button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-l-lg transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Monthly
            </motion.button>
            <motion.button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-r-lg transition-colors ${
                billingCycle === 'yearly'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Yearly
              <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                Save 20%
              </span>
            </motion.button>
          </motion.div>

        {/* Error Display */}
        {error && (
          <div className="max-w-md mx-auto mb-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
              <div className="flex items-center justify-between">
                <span className="block sm:inline">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-2 text-red-500 hover:text-red-700 font-bold"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Loading Overlay */}
        {Object.values(loading).some(v => v) && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3"></div>
                <p className="text-foreground font-medium">Processing payment...</p>
                <p className="text-sm text-muted-foreground mt-1">Redirecting to secure checkout</p>
              </div>
            </div>
          </div>
        )}

          {/* Pricing Cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto px-2 sm:px-4"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                className={`relative rounded-2xl p-8 transition-all duration-300 backdrop-blur-sm ${
                  plan.popular
                    ? 'bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-2 border-purple-500/50 shadow-xl scale-105'
                    : 'bg-gray-800/50 border border-gray-700 hover:shadow-lg hover:shadow-purple-500/10'
                }`}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: plan.popular ? 1.05 : 1 }}
                transition={{ duration: 0.6, delay: 1.0 + index * 0.2 }}
                whileHover={{ 
                  scale: plan.popular ? 1.08 : 1.03, 
                  y: -10,
                  boxShadow: plan.popular 
                    ? "0 25px 50px -12px rgba(147, 51, 234, 0.25)" 
                    : "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                }}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1 shadow-lg">
                    <Star className="w-4 h-4" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-300 mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center">
                  {plan.price.monthly === 0 ? (
                    <span className="text-4xl font-bold text-white">Free</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                        ${billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly}
                      </span>
                      <span className="text-gray-400 ml-2">
                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Coming Soon Features */}
              {plan.comingSoon.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs text-gray-400 mb-2">Coming Soon:</p>
                  <ul className="space-y-1">
                    {plan.comingSoon.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-gray-400">
                        <Star className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA Button */}
              {plan.name === 'Free' ? (
                <Link
                  href="/"
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-purple-500/25'
                    : plan.name === 'Free'
                    ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-gray-600'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-purple-500/25'
                }`}>
                  <span className="flex items-center justify-center gap-2">
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ) : plan.name === 'Pro' ? (
                <button
                  onClick={() => handleCheckout(plan.name, billingCycle)}
                  disabled={loading[`${plan.name}-${billingCycle}`]}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    plan.popular
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95'
                      : 'bg-accent text-accent-foreground hover:bg-accent/80 border border-border active:bg-accent/90'
                  } group-hover:shadow-lg transform group-hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px]`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {loading[`${plan.name}-${billingCycle}`] ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm sm:text-base">Processing...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm sm:text-base">{plan.cta}</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                </button>
              ) : plan.name === 'Enterprise' ? (
                <a
                  href="mailto:sales@rolefitai.com"
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 inline-block text-center ${
                    plan.popular
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95'
                      : 'bg-accent text-accent-foreground hover:bg-accent/80 border border-border active:bg-accent/90'
                  } group-hover:shadow-lg transform group-hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </a>
              ) : (
                <button
                  onClick={() => handleCheckout(plan.name, billingCycle)}
                  disabled={loading[`${plan.name}-${billingCycle}`] || !plan[`priceId${billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)}`]}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    plan.popular
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95'
                      : 'bg-accent text-accent-foreground hover:bg-accent/80 border border-border active:bg-accent/90'
                  } group-hover:shadow-lg transform group-hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px]`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {loading[`${plan.name}-${billingCycle}`] ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm sm:text-base">Processing...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm sm:text-base">{plan.cta}</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                </button>
              )}
              </motion.div>
            ))}
          </motion.div>

        {/* Comparison Section */}
        <div className="mt-12 sm:mt-16 max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-center text-foreground mb-6 sm:mb-8">
            Compare All Features
          </h2>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[600px] sm:min-w-0 border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 sm:py-4 px-2 sm:px-4 text-foreground font-semibold text-sm sm:text-base">Features</th>
                  <th className="text-center py-3 sm:py-4 px-2 sm:px-4 text-foreground font-semibold text-sm sm:text-base">Free</th>
                  <th className="text-center py-3 sm:py-4 px-2 sm:px-4 text-foreground font-semibold text-sm sm:text-base">Pro</th>
                  <th className="text-center py-3 sm:py-4 px-2 sm:px-4 text-foreground font-semibold text-sm sm:text-base">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  'Resume Templates',
                  'Resume Creation',
                  'ATS Optimization',
                  'Cover Letter Generator',
                  'LinkedIn Integration',
                  'Priority Support',
                  'Team Collaboration',
                  'API Access'
                ].map((feature, index) => (
                  <tr key={feature} className="border-b border-border hover:bg-accent/5 transition-colors">
                    <td className="py-3 sm:py-4 px-2 sm:px-4 text-foreground text-sm sm:text-base">{feature}</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4 text-sm sm:text-base">
                      {feature === 'Resume Templates' ? 'Basic' :
                       feature === 'Resume Creation' ? '1' :
                       feature === 'ATS Optimization' ? 'Basic' :
                       <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4 text-sm sm:text-base">
                      {feature === 'Resume Templates' ? 'Premium' :
                       feature === 'Resume Creation' ? 'Unlimited' :
                       feature === 'ATS Optimization' ? 'Advanced' :
                       <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary mx-auto" />}
                    </td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4 text-sm sm:text-base">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 sm:mt-16 max-w-3xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-center text-foreground mb-6 sm:mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3 sm:space-y-4">
            {[
              {
                q: "Can I change plans anytime?",
                a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately."
              },
              {
                q: "Is there a free trial?",
                a: "Yes, all paid plans come with a 7-day free trial. No credit card required to start."
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards, PayPal, and bank transfers for enterprise plans."
              }
            ].map((faq, index) => (
              <details
                key={index}
                className="group border border-border rounded-lg p-3 sm:p-4 hover:border-primary/50 transition-colors"
              >
                <summary className="flex justify-between items-center cursor-pointer font-medium text-foreground text-sm sm:text-base">
                  {faq.q}
                  <ArrowRight className="w-4 h-4 transition-transform group-open:rotate-90 flex-shrink-0" />
                </summary>
                <p className="mt-2 text-muted-foreground text-sm sm:text-base">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 sm:mt-16 text-center px-4">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">
              Ready to Build Your Perfect Resume?
            </h3>
            <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">
              Join thousands of professionals who have landed their dream jobs with our AI-powered resume builder.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm sm:text-base"
            >
              Start Building Now
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Link>
          </div>
        </div>
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