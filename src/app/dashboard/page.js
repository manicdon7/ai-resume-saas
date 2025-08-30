'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { setUser, setCredits, signOut as reduxSignOut } from '../../store/slices/authSlice';
import { setParsedData, setResumeText, clearResume } from '../../store/slices/resumeSlice';
import { motion } from 'framer-motion';
import {
  FileText,
  Upload,
  BarChart3,
  Target,
  Briefcase,
  Clock,
  CheckCircle,
  Crown,
  Zap,
  Users,
  Trash2,
  Send
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { showToast } from '@/lib/toast-config';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, isPro, credits, loading } = useSelector(state => state.auth);
  const { parsedData, resumeText, uploadedAt } = useSelector(state => state.resume);
  const [recentActivity, setRecentActivity] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');

  const fetchUserData = async (currentUser) => {
    try {
      const token = await currentUser.getIdToken();
      dispatch(setCredits(100));
      setRecentActivity([
        { type: 'resume_upload', date: new Date().toISOString(), description: 'Resume uploaded' },
        { type: 'job_search', date: new Date().toISOString(), description: 'Job search performed' }
      ]);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        dispatch(setUser(currentUser));
        fetchUserData(currentUser);
      } else {
        dispatch(reduxSignOut());
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [dispatch, router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      dispatch(reduxSignOut());
      window.localStorage.removeItem('token');
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setFileName(file.name);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.text) {
        dispatch(setResumeText(data.text));
        showToast.success(`Successfully uploaded ${file.name}`);
      } else {
        showToast.error('Failed to extract text from file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast.error('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Please sign in</h2>
          <Link href="/" className="text-purple-400 hover:underline">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-blue-900/10 to-black" />
      </div>

      <div className="relative z-10">
        <Navbar user={user} onSignOut={handleSignOut} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Dashboard
              </span>
            </h1>
            <p className="text-gray-300 text-lg">
              Manage your resume and track your job applications
            </p>
          </motion.div>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {parsedData?.name || user?.displayName || 'Professional'}!
              </h1>
              <p className="text-gray-400">
                Here's your career optimization dashboard
              </p>
            </div>
            {isPro && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-lg shadow-lg">
                <Crown className="w-5 h-5" />
                <span className="font-semibold">PRO</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Credits Remaining</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">{credits}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Resumes Created</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">3</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Applications Sent</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">12</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Send className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 backdrop-blur-sm">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <Upload className="w-6 h-6 text-purple-400" />
                  <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    Resume Management
                  </span>
                </h2>
                {!resumeText ? (
                  <div className="border-2 border-dashed border-gray-600 rounded-xl p-10 text-center hover:border-purple-500/50 transition-all duration-300 bg-gray-900/30">
                    <input
                      type="file"
                      id="resume-upload"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <label htmlFor="resume-upload" className="cursor-pointer">
                      {uploading ? (
                        <div className="flex flex-col items-center gap-4">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                          <p className="text-sm text-gray-400">Processing {fileName}...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                          <h3 className="text-xl font-semibold text-white mb-3">
                            Upload Your Resume
                          </h3>
                          <p className="text-gray-300 mb-6">
                            Upload your resume in PDF, DOC, or DOCX format
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-medium text-white">Resume Uploaded</p>
                          <p className="text-sm text-gray-400">
                            {uploadedAt ? new Date(uploadedAt).toLocaleDateString() : 'Recently'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            dispatch(clearResume());
                            setFileName('');
                            showToast.success('Resume removed successfully');
                          }}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                        <button
                          onClick={() => document.getElementById('resume-upload').click()}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          Update
                        </button>
                        <Link
                          href="/analysis"
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                        >
                          <BarChart3 className="w-4 h-4" />
                          Analyze
                        </Link>
                      </div>
                    </div>
                    {parsedData && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-700/20 rounded-lg">
                          <p className="text-sm font-medium text-gray-400 mb-1">Name</p>
                          <p className="text-white">{parsedData.name || 'Not extracted'}</p>
                        </div>
                        <div className="p-4 bg-gray-700/20 rounded-lg">
                          <p className="text-sm font-medium text-gray-400 mb-1">Email</p>
                          <p className="text-white">{parsedData.email || 'Not extracted'}</p>
                        </div>
                        <div className="p-4 bg-gray-700/20 rounded-lg">
                          <p className="text-sm font-medium text-gray-400 mb-1">Phone</p>
                          <p className="text-white">{parsedData.phone || 'Not extracted'}</p>
                        </div>
                        <div className="p-4 bg-gray-700/20 rounded-lg">
                          <p className="text-sm font-medium text-gray-400 mb-1">Skills</p>
                          <p className="text-white">
                            {parsedData.skills?.length ? parsedData.skills.join(', ') : 'Not extracted'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    Quick Actions
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    href="/cover-letter"
                    className="p-4 border border-gray-600 rounded-lg hover:bg-gray-700/50 transition-colors group block"
                  >
                    <FileText className="w-8 h-8 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                    <h3 className="font-medium text-white">Cover Letter</h3>
                    <p className="text-sm text-gray-400">Generate & edit cover letters</p>
                  </Link>
                  <Link
                    href="/jobs"
                    className="p-4 border border-gray-600 rounded-lg hover:bg-gray-700/50 transition-colors group block"
                  >
                    <Briefcase className="w-8 h-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                    <h3 className="font-medium text-white">Find Jobs</h3>
                    <p className="text-sm text-gray-400">Discover matching opportunities</p>
                  </Link>
                  <Link
                    href="/analysis"
                    className="p-4 border border-gray-600 rounded-lg hover:bg-gray-700/50 transition-colors group block"
                  >
                    <Target className="w-8 h-8 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
                    <h3 className="font-medium text-white">ATS Analysis</h3>
                    <p className="text-sm text-gray-400">Optimize for ATS systems</p>
                  </Link>
                </div>
              </div>
            </div>

            <div className="space-y-6">

              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">

                  <Users className="w-5 h-5 text-cyan-400" />
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Account Status
                  </span>
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Plan</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isPro ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-600/50 text-gray-300'}`}>
                      {isPro ? 'PRO' : 'FREE'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Credits</span>
                    <span className="text-sm font-medium text-white">{credits}</span>
                  </div>
                  {!isPro && (
                    <Link
                      href="/pricing"
                      className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity text-center block"
                    >
                      Upgrade to PRO
                    </Link>
                  )}
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-400" />
                  <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    Recent Activity
                  </span>
                </h3>
                <div className="space-y-3">
                  {recentActivity.length > 0 ? (
                    recentActivity.slice(0, 5).map((activity, index) => (
                      <div

                        key={index}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/30 transition-colors"
                      >
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm text-white">{activity.description}</p>
                          <p className="text-xs text-gray-400">{activity.timestamp}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}