'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { auth, googleProvider } from '../../lib/firebase';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { setUser } from '@/store/slices/authSlice';
import Navbar from '../components/Navbar';
import AuthModal from '../components/AuthModal';
import FeatureAvailabilityIndicator from '../components/FeatureAvailabilityIndicator';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
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
  Clock,
  Rocket,
  Brain,
  Lightbulb
} from 'lucide-react';
import { showToast, toastMessages } from '@/lib/toast-config';


export default function LandingPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const statsRef = useRef(null);

  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });

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

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      showToast.success(toastMessages.auth.loginSuccess);
      router.push('/dashboard');
    } catch (error) {
      console.error('Sign in error:', error);
      showToast.error(toastMessages.auth.loginError);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      showToast.success(toastMessages.auth.logoutSuccess);
    } catch (error) {
      console.error('Sign out error:', error);
      showToast.error('Failed to sign out');
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
    showToast.success('Welcome to RoleFitAI!');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-blue-900/10 to-black" />

        {/* Floating orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -150, 0],
            y: [0, 100, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
        />

        {/* Mouse follower */}
        <motion.div
          className="absolute w-6 h-6 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full blur-sm pointer-events-none"
          animate={{
            x: mousePosition.x - 12,
            y: mousePosition.y - 12,
          }}
          transition={{
            type: "spring",
            damping: 30,
            stiffness: 200,
            mass: 0.5
          }}
        />
      </div>

      <div className="relative z-10">
        <Navbar user={user} onSignOut={handleSignOut} onGetStarted={handleGetStarted} />

        {/* Hero Section */}
        <motion.section
          ref={heroRef}
          style={{ y, opacity }}
          className="relative px-4 py-20 overflow-hidden"
        >
          <div className="relative max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center max-w-4xl mx-auto mb-16"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={heroInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-8 backdrop-blur-sm"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </motion.div>
                <span className="text-sm font-medium text-purple-300">AI-Powered Resume Builder</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-6xl md:text-8xl font-bold mb-8 leading-tight"
              >
                <motion.span
                  className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent inline-block"
                  style={{
                    backgroundSize: '200% 200%',
                    animation: 'gradient-shine 3s ease-in-out infinite'
                  }}
                >
                  Transform Your
                </motion.span>
                <br />
                <motion.span
                  className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent inline-block"
                  style={{
                    backgroundSize: '200% 200%',
                    animation: 'gradient-shine 3s ease-in-out infinite 1.5s'
                  }}
                >
                  Career
                </motion.span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed"
              >
                RoleFitAI uses cutting-edge AI to optimize your resume for ATS systems and
                tailor it to your dream job. Get professional results in seconds.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
              >
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGetStarted}
                  disabled={loading}
                  className="group px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-semibold text-lg flex items-center gap-2 shadow-2xl hover:shadow-purple-500/25 disabled:opacity-50 border border-purple-500/20 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      <Rocket className="w-5 h-5" />
                      {user ? 'Start Now' : 'Get Started'}
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/pricing')}
                  className="px-10 py-4 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-800/50 hover:border-gray-500 transition-all duration-300 font-semibold text-lg flex items-center gap-2 backdrop-blur-sm"
                >
                  <Brain className="w-5 h-5" />
                  Learn More
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </motion.div>

              {/* Social Proof */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-8 text-gray-400"
              >
                {[
                  { icon: Users, text: "10,000+ professionals trust us", color: "text-purple-400" },
                  { icon: Star, text: "4.9/5 average rating", color: "text-yellow-400" },
                  { icon: Award, text: "95% job success rate", color: "text-cyan-400" }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={heroInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{ delay: 1.2 + index * 0.1, duration: 0.6 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                    >
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </motion.div>
                    <span className="text-sm">{item.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* Features Section */}
        <motion.section
          ref={featuresRef}
          className="px-4 py-20 bg-gray-900/50 relative overflow-hidden"
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, purple 2px, transparent 2px),
                               radial-gradient(circle at 75% 75%, blue 2px, transparent 2px)`,
              backgroundSize: '50px 50px',
              animation: 'float 20s ease-in-out infinite'
            }} />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <motion.h2
                initial={{ opacity: 0, scale: 0.9 }}
                animate={featuresInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="text-5xl font-bold mb-6"
              >
                <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Enhance Your Resume
                </span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-xl text-gray-300 max-w-3xl mx-auto"
              >
                Upload or paste your resume to get AI-optimized results
              </motion.p>
            </motion.div>

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
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50, rotateX: 45 }}
                  animate={featuresInView ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 50, rotateX: 45 }}
                  transition={{ delay: index * 0.1, duration: 0.8, ease: "easeOut" }}
                  whileHover={{
                    scale: 1.05,
                    y: -10,
                    rotateY: 5,
                    transition: { duration: 0.3 }
                  }}
                  className="group bg-gray-800/50 border border-gray-700 rounded-2xl p-8 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 backdrop-blur-sm cursor-pointer relative overflow-hidden"
                >
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <motion.div
                    className={`${feature.color} mb-6 relative z-10`}
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-xl font-semibold text-white mb-4 relative z-10">{feature.title}</h3>
                  <p className="text-gray-300 relative z-10">{feature.description}</p>

                  {/* Animated border */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'subtract'
                  }} />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

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
                © {new Date().getFullYear()} RoleFitAI. All rights reserved.
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
    </div>
  );
}
