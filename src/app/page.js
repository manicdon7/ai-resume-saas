'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { auth, googleProvider } from '../../lib/firebase';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { setUser } from '@/store/slices/authSlice';
import Navbar from '../components/Navbar';
import AuthModal from '../components/AuthModal';
import { 
  FileText,
  Upload,
  Zap,
  Target,
  Briefcase,
  TrendingUp,
  Shield,
  Users,
  Star,
  Award,
  ArrowRight,
  ChevronRight,
  Sparkles,
  CheckCircle,
  Globe,
  Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function LandingPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        dispatch(setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          emailVerified: currentUser.emailVerified
        }));
      }
    });
    return () => unsubscribe();
  }, [dispatch]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Successfully signed in!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      toast.success('Signed out successfully!');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  const handleGetStarted = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAuthSuccess = (user) => {
    toast.success('Welcome to RoleFitAI!');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar user={user} onSignOut={handleSignOut} />
      
      {/* Hero Section */}
      <section className="relative px-4 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-8">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-300">AI-Powered Resume Builder</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Transform Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Career
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              RoleFitAI uses cutting-edge AI to optimize your resume for ATS systems and 
              tailor it to your dream job. Get professional results in seconds.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <button
                onClick={handleGetStarted}
                disabled={loading}
                className="px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-semibold text-lg flex items-center gap-2 shadow-2xl hover:shadow-purple-500/25 disabled:opacity-50 border border-purple-500/20"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    {user ? 'Start Now' : 'Start Now'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              
              <button
                onClick={() => router.push('/pricing')}
                className="px-10 py-4 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-800/50 hover:border-gray-500 transition-all duration-300 font-semibold text-lg flex items-center gap-2"
              >
                Learn More
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            {/* Social Proof */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-gray-400">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <span className="text-sm">10,000+ professionals trust us</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-sm">4.9/5 average rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-cyan-400" />
                <span className="text-sm">95% job success rate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Enhance Your Resume
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Upload or paste your resume to get AI-optimized results
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <FileText className="w-8 h-8" />,
                title: 'Smart Resume Builder',
                description: 'Create ATS-optimized resumes with AI-powered suggestions and professional templates.',
                color: 'text-blue-600'
              },
              {
                icon: <Target className="w-8 h-8" />,
                title: 'ATS Optimization',
                description: 'Ensure your resume passes applicant tracking systems with our advanced analysis.',
                color: 'text-green-600'
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: 'Cover Letter Generator',
                description: 'Generate personalized cover letters tailored to specific job descriptions.',
                color: 'text-purple-600'
              },
              {
                icon: <Briefcase className="w-8 h-8" />,
                title: 'Job Recommendations',
                description: 'Get AI-powered job matches based on your resume and career preferences.',
                color: 'text-orange-600'
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: 'Career Analytics',
                description: 'Track your application success and get insights to improve your job search.',
                color: 'text-red-600'
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: 'Privacy First',
                description: 'Your data is secure and private. We never share your information with third parties.',
                color: 'text-indigo-600'
              }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 backdrop-blur-sm">
                <div className={`${feature.color} mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 py-20 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Get from resume to job offer in just a few simple steps.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Upload Your Resume',
                description: 'Upload your existing resume or create one from scratch using our intuitive builder.',
                icon: <FileText className="w-12 h-12 text-purple-400" />
              },
              {
                step: '02',
                title: 'AI Optimization',
                description: 'Our AI analyzes and optimizes your resume for ATS systems and specific job requirements.',
                icon: <Zap className="w-12 h-12 text-blue-400" />
              },
              {
                step: '03',
                title: 'Apply & Get Hired',
                description: 'Use our job recommendations and cover letter generator to apply with confidence.',
                icon: <Target className="w-12 h-12 text-cyan-400" />
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-purple-500/25">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full flex items-center justify-center text-sm font-bold text-black">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">{step.title}</h3>
                <p className="text-gray-300">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 py-20 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { number: '10,000+', label: 'Resumes Created' },
              { number: '95%', label: 'ATS Pass Rate' },
              { number: '50,000+', label: 'Job Matches' },
              { number: '4.9/5', label: 'User Rating' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">{stat.number}</div>
                <div className="text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-4 py-20 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                What Our Users Say
              </span>
            </h2>
            <p className="text-xl text-gray-300">
              Join thousands of professionals who've transformed their careers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Johnson',
                role: 'Software Engineer',
                company: 'Tech Corp',
                content: 'RoleFitAI helped me land my dream job at a top tech company. The ATS optimization was game-changing!',
                rating: 5
              },
              {
                name: 'Michael Chen',
                role: 'Marketing Manager',
                company: 'Growth Inc',
                content: 'The cover letter generator saved me hours of work. I got 3x more interview calls after using this platform.',
                rating: 5
              },
              {
                name: 'Emily Rodriguez',
                role: 'Product Designer',
                company: 'Design Studio',
                content: 'The job recommendations were spot-on. I found opportunities I never would have discovered on my own.',
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 backdrop-blur-sm">
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 italic text-lg">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-white text-lg">{testimonial.name}</div>
                  <div className="text-gray-400">{testimonial.role} at {testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Ready to Transform Your Career?
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Join thousands of professionals who've already landed their dream jobs with RoleFitAI.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={handleGetStarted}
              disabled={loading}
              className="px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-semibold text-lg flex items-center gap-2 shadow-2xl hover:shadow-purple-500/25 disabled:opacity-50 border border-purple-500/20"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  Start Building Now
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            
            <div className="flex items-center gap-2 text-gray-400">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>Free to start • No credit card required</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-12 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">RoleFitAI</h3>
              <p className="text-muted-foreground mb-4">
                AI-powered career tools to help you land your dream job.
              </p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="w-4 h-4" />
                <span className="text-sm">Trusted worldwide</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><button onClick={() => router.push('/dashboard')} className="hover:text-foreground transition-colors">Resume Builder</button></li>
                <li><button onClick={() => router.push('/cover-letter')} className="hover:text-foreground transition-colors">Cover Letters</button></li>
                <li><button onClick={() => router.push('/jobs')} className="hover:text-foreground transition-colors">Job Search</button></li>
                <li><button onClick={() => router.push('/analysis')} className="hover:text-foreground transition-colors">ATS Analysis</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><button onClick={() => router.push('/pricing')} className="hover:text-foreground transition-colors">Pricing</button></li>
                <li><button onClick={() => router.push('/contact')} className="hover:text-foreground transition-colors">Contact</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="mailto:support@rolefitai.com" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="mailto:support@rolefitai.com" className="hover:text-foreground transition-colors">Contact Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © 2024 RoleFitAI. All rights reserved.
            </p>
            <div className="flex items-center gap-4 mt-4 sm:mt-0">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Privacy Protected</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
