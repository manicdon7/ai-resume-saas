'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import ATSOptimizer from '../../components/ATSOptimizer';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

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
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Please sign in</h2>
          <Link href="/" className="text-purple-400 hover:text-purple-300 hover:underline transition-colors">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  if (showForm || (!resumeContent || !jobDescription)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <Navbar user={user} onSignOut={handleSignOut} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4 shadow-lg">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"></div>
                </div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">ATS Optimization Analysis</h1>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Analyze your resume against Applicant Tracking Systems to improve your chances of getting hired.
              </p>
              {isPro && (
                <div className="inline-block px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold rounded-full mt-2 shadow-lg">
                  PRO ANALYSIS AVAILABLE
                </div>
              )}
            </div>

            {/* Form */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 shadow-lg backdrop-blur-sm">
              <form onSubmit={handleSubmitForm} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
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
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    type="submit"
                    disabled={!formResume.trim() || !formJob.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/25"
                  >
                    Analyze Resume
                  </button>
                  <Link
                    href="/"
                    className="px-8 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/50 hover:border-purple-400/50 transition-colors font-medium text-center"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <Navbar user={user} onSignOut={handleSignOut} />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <Link href="/" className="mb-6 inline-flex items-center text-gray-400 hover:text-purple-400 transition-colors">
              <span className="mr-2">←</span> Back to Home
            </Link>
          </div>

          {/* ATS Optimizer Component */}
          <ATSOptimizer
            resumeContent={resumeContent}
            jobDescription={jobDescription}
            isPro={isPro}
            onAnalysisComplete={(data) => {
              console.log('Analysis completed:', data);
            }}
          />

          {/* Edit Data Button */}
          <div className="text-center pt-4">
            <button
              onClick={() => {
                setFormResume(resumeContent);
                setFormJob(jobDescription);
                setShowForm(true);
              }}
              className="px-6 py-2 text-sm border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/50 hover:border-purple-400/50 transition-colors"
            >
              Edit Resume or Job Description
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function AnalysisPageLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-lg text-muted-foreground">Loading analysis page...</p>
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
