'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import ATSOptimizer from '../../components/ATSOptimizer';
import Navbar from '@/components/Navbar';
import CreditProtectedAction from '@/components/CreditProtectedAction';
import FeatureAvailabilityIndicator from '@/components/FeatureAvailabilityIndicator';
import Link from 'next/link';
import { ArrowLeft, Target, Sparkles, FileText, Briefcase } from 'lucide-react';

// Component that uses useSearchParams - wrapped in Suspense
function AnalysisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resumeContent, setResumeContent] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formResume, setFormResume] = useState('');
  const [formJob, setFormJob] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Check pro status
        try {
          const token = await currentUser.getIdToken();
          const response = await fetch('/api/user/credits', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setIsPro(data.isPro);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Get data from URL parameters or localStorage
    const resumeParam = searchParams.get('resume');
    const jobParam = searchParams.get('job');

    if (resumeParam && jobParam) {
      try {
        const decodedResume = decodeURIComponent(resumeParam);
        const decodedJob = decodeURIComponent(jobParam);
        setResumeContent(decodedResume);
        setJobDescription(decodedJob);
      } catch (e) {
        console.error('Error decoding URL parameters:', e);
      }
    } else {
      // Try to get from localStorage as fallback
      const savedResume = localStorage.getItem('ats-resume-content');
      const savedJob = localStorage.getItem('ats-job-description');

      if (savedResume && savedJob) {
        setResumeContent(savedResume);
        setJobDescription(savedJob);
      } else {
        setShowForm(true);
      }
    }

    return () => unsubscribe();
  }, [searchParams]);

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (formResume.trim() && formJob.trim()) {
      setResumeContent(formResume);
      setJobDescription(formJob);
      setShowForm(false);
      // Save to localStorage for future use
      localStorage.setItem('ats-resume-content', formResume);
      localStorage.setItem('ats-job-description', formJob);
    }
  };

  const handleGoBack = () => {
    router.push('/');
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden flex items-center justify-center">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden flex items-center justify-center">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        <motion.div
          className="text-center relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-white mb-4">Please sign in</h2>
          <Link href="/" className="text-purple-400 hover:text-purple-300 hover:underline transition-colors">
            Go to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  if (showForm || (!resumeContent || !jobDescription)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        {/* Floating Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-20 w-4 h-4 bg-purple-400 rounded-full opacity-60"
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-40 right-32 w-6 h-6 bg-blue-400 rounded-full opacity-40"
            animate={{
              y: [20, -20, 20],
              x: [10, -10, 10],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-32 left-1/3 w-3 h-3 bg-cyan-400 rounded-full opacity-50"
            animate={{
              y: [-15, 15, -15],
              x: [-5, 5, -5],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="relative z-10">
          <Navbar user={user} onSignOut={handleSignOut} />
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <motion.div
                className="text-center mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <motion.div
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4 shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <Target className="w-4 h-4 text-purple-600" />
                  </div>
                </motion.div>
                <motion.h1
                  className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4 animate-gradient-shine"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  ATS Optimization Analysis
                </motion.h1>
                <motion.p
                  className="text-gray-300 max-w-2xl mx-auto text-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  Analyze your resume against Applicant Tracking Systems to improve your chances of getting hired.
                </motion.p>
                {isPro && (
                  <motion.div
                    className="inline-block px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold rounded-full mt-2 shadow-lg"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    PRO ANALYSIS AVAILABLE
                  </motion.div>
                )}
              </motion.div>

              {/* Form */}
              <motion.div
                className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 shadow-lg backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                whileHover={{ scale: 1.01 }}
              >
                <form onSubmit={handleSubmitForm} className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 1.0 }}
                  >
                    <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-400" />
                      Resume Content <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={formResume}
                      onChange={(e) => setFormResume(e.target.value)}
                      className="w-full h-48 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-vertical focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all"
                      placeholder="Paste your resume content here..."
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Copy and paste the text content of your resume
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                  >
                    <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-400" />
                      Job Description <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={formJob}
                      onChange={(e) => setFormJob(e.target.value)}
                      className="w-full h-48 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-vertical focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all"
                      placeholder="Paste the job description here..."
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Copy and paste the job description you're applying for
                    </p>
                  </motion.div>

                  <motion.div
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.4 }}
                  >
                    <CreditProtectedAction
                      action="ats_analysis"
                      requiredCredits={1}
                      showUpgradePrompt={true}
                    >
                      <motion.button
                        type="submit"
                        disabled={!formResume.trim() || !formJob.trim()}
                        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Sparkles className="w-5 h-5" />
                        Analyze Resume
                        <FeatureAvailabilityIndicator
                          featureName="atsAnalysis"
                          size="small"
                          className="ml-2"
                        />
                      </motion.button>
                    </CreditProtectedAction>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link
                        href="/"
                        className="px-8 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700/50 hover:border-purple-400/50 transition-colors font-medium text-center flex items-center justify-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Cancel
                      </Link>
                    </motion.div>
                  </motion.div>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-20 w-4 h-4 bg-purple-400 rounded-full opacity-60"
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-40 right-32 w-6 h-6 bg-blue-400 rounded-full opacity-40"
          animate={{
            y: [20, -20, 20],
            x: [10, -10, 10],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-32 left-1/3 w-3 h-3 bg-cyan-400 rounded-full opacity-50"
          animate={{
            y: [-15, 15, -15],
            x: [-5, 5, -5],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative z-10">
        <Navbar user={user} onSignOut={handleSignOut} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <motion.div
              className="text-center space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/" className="mb-6 inline-flex items-center text-gray-400 hover:text-purple-400 transition-colors">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                </Link>
              </motion.div>
            </motion.div>

            {/* ATS Optimizer Component */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <ATSOptimizer
                resumeContent={resumeContent}
                jobDescription={jobDescription}
                isPro={isPro}
                onAnalysisComplete={(data) => {
                  console.log('Analysis completed:', data);
                }}
              />
            </motion.div>

            {/* Edit Data Button */}
            <motion.div
              className="text-center pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <motion.button
                onClick={() => {
                  setFormResume(resumeContent);
                  setFormJob(jobDescription);
                  setShowForm(true);
                }}
                className="px-6 py-2 text-sm border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/50 hover:border-purple-400/50 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Edit Resume or Job Description
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function AnalysisPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
        <p className="text-lg text-gray-300">Loading analysis page...</p>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function AnalysisPage() {
  return (
    <Suspense fallback={<AnalysisPageLoading />}>
      <AnalysisContent />
    </Suspense>
  );
}
