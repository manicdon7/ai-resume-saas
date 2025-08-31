'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { setUser, setCredits, setProStatus, signOut as reduxSignOut, clearAllData } from '../../store/slices/authSlice';
import { setResumeText, setParsedData, clearResume } from '../../store/slices/resumeSlice';
import { motion, AnimatePresence } from 'framer-motion';

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
  Send,
  TrendingUp,
  Activity,
  Sparkles,
  ArrowRight,
  Edit,
  Award,
  Rocket,
  Eye,
  User
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { showToast } from '@/lib/toast-config';
import CreditDrawer from '@/components/CreditDrawer';
import ExtractedTextDisplay from '@/components/ExtractedTextDisplay';
import ParsedDataCard from '@/components/ParsedDataCard';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, isPro, credits, loading } = useSelector(state => state.auth);
  const { parsedData, resumeText, uploadedAt } = useSelector(state => state.resume);
  


  // State management
  const [recentActivity, setRecentActivity] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [creditDrawerOpen, setCreditDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'text', 'parsed'
  const [dashboardStats, setDashboardStats] = useState({
    resumesCreated: 0,
    applicationsSubmitted: 0,
    profileViews: 0,
    successRate: 0
  });

  // Fetch user dashboard data
  const fetchUserData = useCallback(async (currentUser) => {
    setLoadingDashboard(true);
    try {
      const token = await currentUser.getIdToken();
      const dashboardResponse = await fetch('/api/user/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        dispatch(setCredits(dashboardData.user.credits));
        dispatch(setProStatus(dashboardData.user.isPro));

        setDashboardStats({
          resumesCreated: dashboardData.stats.resumesCreated || 0,
          applicationsSubmitted: dashboardData.stats.applicationsSubmitted || 0,
          profileViews: Math.floor(Math.random() * 100) + 50,
          successRate: 85
        });

        setRecentActivity(dashboardData.recentActivity || []);

        if (dashboardData.resume.hasResume) {
          dispatch(setResumeText(dashboardData.resume.resumeText || ''));
          dispatch(setParsedData(dashboardData.resume.parsedData));
        }
      } else {
        dispatch(setCredits(3));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      dispatch(setCredits(3));
    } finally {
      setLoadingDashboard(false);
    }
  }, [dispatch]);

  // Auth state listener
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
  }, [dispatch, router, fetchUserData]);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      dispatch(clearAllData());
      dispatch(clearResume());
      window.localStorage.removeItem('token');
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Handle text editing
  const handleTextEdit = async (newText) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      const token = await currentUser.getIdToken();
      const response = await fetch('/api/resume/save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resumeText: newText })
      });

      if (response.ok) {
        dispatch(setResumeText(newText));
        await fetchUserData(currentUser);
      } else {
        throw new Error('Failed to save resume text');
      }
    } catch (error) {
      console.error('Error saving text:', error);
      throw error;
    }
  };

  // Handle reparsing
  const handleReparse = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      const token = await currentUser.getIdToken();
      const response = await fetch('/api/resume/parse', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resumeText })
      });

      if (response.ok) {
        const data = await response.json();
        dispatch(setParsedData(data.parsedData));
        showToast.success('Resume reparsed successfully');
      } else {
        throw new Error('Failed to reparse resume');
      }
    } catch (error) {
      console.error('Error reparsing:', error);
      showToast.error('Failed to reparse resume');
    }
  };

  // Handle parsed data update
  const handleParsedDataUpdate = async (newParsedData) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      const token = await currentUser.getIdToken();
      const response = await fetch('/api/resume/save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ parsedData: newParsedData })
      });

      if (response.ok) {
        dispatch(setParsedData(newParsedData));
      } else {
        throw new Error('Failed to save parsed data');
      }
    } catch (error) {
      console.error('Error saving parsed data:', error);
      throw error;
    }
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('File selected:', file.name, file.type, file.size);

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      showToast.error('Please upload a PDF, DOCX, or TXT file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      showToast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setFileName(file.name);

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('Getting user token...');
      // Use Firebase Auth current user instead of Redux user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      const token = await currentUser.getIdToken();
      console.log('Token obtained, making request...');

      const response = await fetch('/api/extract-text', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok && data.text) {
        dispatch(setResumeText(data.text));
        if (data.parsedData) {
          dispatch(setParsedData(data.parsedData));
        }
        showToast.success(`Successfully uploaded ${file.name}`);
        await fetchUserData(currentUser);
      } else {
        showToast.error(data.error || 'Failed to extract text from file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast.error('Error uploading file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Loading state
  if (loading || loadingDashboard) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full mx-auto mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <h2 className="text-2xl font-bold text-white mb-2">Loading Dashboard</h2>
          <p className="text-gray-400">Preparing your workspace...</p>
        </motion.div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-3xl font-bold text-white mb-4">Please Sign In</h2>
          <p className="text-gray-400 mb-8">Access your personalized dashboard</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-300"
          >
            Go to Home <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background - matching landing page */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-blue-900/10 to-black" />

        {/* Floating orbs - matching landing page */}
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
          className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="relative z-10">
        <Navbar user={user} onSignOut={handleSignOut} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                  Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                    {parsedData?.name || user?.displayName || 'Professional'}
                  </span>!
                </h1>
                <p className="text-xl text-gray-300">
                  Ready to take your career to the next level?
                </p>
              </div>

              {isPro && (
                <motion.div
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-full font-semibold shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Crown className="w-5 h-5" />
                  PRO MEMBER
                  <Sparkles className="w-4 h-4" />
                </motion.div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Credits', value: isPro ? '∞' : credits, icon: Zap, color: 'from-purple-500 to-purple-600', onClick: () => setCreditDrawerOpen(true) },
                { label: 'Resumes', value: dashboardStats.resumesCreated, icon: FileText, color: 'from-blue-500 to-blue-600' },
                { label: 'Applications', value: dashboardStats.applicationsSubmitted, icon: Send, color: 'from-green-500 to-green-600' },
                { label: 'Success Rate', value: `${dashboardStats.successRate}%`, icon: TrendingUp, color: 'from-orange-500 to-orange-600' }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className={`bg-gray-800/50 border border-gray-700 rounded-2xl p-4 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 backdrop-blur-sm group ${stat.onClick ? 'cursor-pointer' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  onClick={stat.onClick}
                >
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Resume Management */}
            <div className="lg:col-span-2 space-y-8">
              {/* Resume Management with Tabs */}
              <motion.div
                className="bg-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 backdrop-blur-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {/* Header with Tabs */}
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <Upload className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-white">Resume Management</h2>
                    </div>

                    {resumeText && (
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const currentUser = auth.currentUser;
                              if (!currentUser) {
                                throw new Error('No authenticated user found');
                              }

                              const token = await currentUser.getIdToken();
                              await fetch('/api/user/resume', {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                              });
                              dispatch(clearResume());
                              setActiveTab('overview');
                              showToast.success('Resume removed successfully');
                              await fetchUserData(currentUser);
                            } catch (error) {
                              showToast.error('Failed to remove resume');
                            }
                          }}
                          className="px-3 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <Link
                          href="/analysis"
                          className="px-3 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Tab Navigation */}
                  {resumeText && (
                    <div className="flex gap-1 bg-gray-900/50 p-1 rounded-lg">
                      {[
                        { id: 'overview', label: 'Overview', icon: Eye },
                        { id: 'text', label: 'Raw Text', icon: FileText },
                        { id: 'parsed', label: 'Parsed Data', icon: User }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            activeTab === tab.id
                              ? 'bg-purple-600 text-white shadow-lg'
                              : 'text-gray-400 hover:text-white hover:bg-gray-800'
                          }`}
                        >
                          <tab.icon className="w-4 h-4" />
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {!resumeText ? (
                    <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-purple-500 transition-colors">
                      <input
                        type="file"
                        id="resume-upload"
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploading}
                        key={Date.now()}
                      />
                      <label htmlFor="resume-upload" className="cursor-pointer block">
                        {uploading ? (
                          <div className="flex flex-col items-center gap-4">
                            <motion.div
                              className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            <p className="text-gray-300">Processing {fileName}...</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                              <Upload className="w-8 h-8 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-white mb-2">Upload Your Resume</h3>
                              <p className="text-gray-400">Drag & drop or click to upload PDF, DOCX, or TXT</p>
                              <button
                                onClick={() => document.getElementById('resume-upload').click()}
                                className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                              >
                                Choose File
                              </button>
                            </div>
                          </div>
                        )}
                      </label>
                    </div>
                  ) : (
                    <AnimatePresence mode="wait">
                      {activeTab === 'overview' && (
                        <motion.div
                          key="overview"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center justify-between p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="w-6 h-6 text-green-400" />
                              <div>
                                <p className="font-semibold text-white">Resume Uploaded Successfully</p>
                                <p className="text-sm text-gray-400">
                                  {uploadedAt ? new Date(uploadedAt).toLocaleDateString() : 'Recently'}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => document.getElementById('resume-upload').click()}
                              className="px-3 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {[
                              { label: 'Name', value: parsedData?.name },
                              { label: 'Email', value: parsedData?.email },
                              { label: 'Phone', value: parsedData?.phone },
                              { label: 'Skills', value: parsedData?.skills?.join(', ') }
                            ].map((item, index) => (
                              <div key={index} className="p-3 bg-gray-800/50 rounded-lg">
                                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                                <p className="text-white text-sm">{item.value || 'Not provided'}</p>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => setActiveTab('text')}
                              className="flex-1 flex items-center justify-center gap-2 p-3 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                              View Raw Text
                            </button>
                            <button
                              onClick={() => setActiveTab('parsed')}
                              className="flex-1 flex items-center justify-center gap-2 p-3 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
                            >
                              <User className="w-4 h-4" />
                              View Parsed Data
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === 'text' && (
                        <motion.div
                          key="text"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                        >
                          <ExtractedTextDisplay
                            content={resumeText}
                            parsedData={parsedData}
                            isEditable={true}
                            onEdit={handleTextEdit}
                            onReparse={handleReparse}
                          />
                        </motion.div>
                      )}

                      {activeTab === 'parsed' && (
                        <motion.div
                          key="parsed"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                        >
                          <ParsedDataCard
                            parsedData={parsedData}
                            onUpdate={handleParsedDataUpdate}
                            isEditable={true}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 backdrop-blur-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-purple-400" />
                  Quick Actions
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { title: 'Cover Letter', desc: 'Generate personalized cover letters', icon: FileText, href: '/cover-letter', color: 'from-blue-500 to-blue-600' },
                    { title: 'Find Jobs', desc: 'Discover matching opportunities', icon: Briefcase, href: '/jobs', color: 'from-green-500 to-green-600' },
                    { title: 'ATS Analysis', desc: 'Optimize for ATS systems', icon: Target, href: '/analysis', color: 'from-purple-500 to-purple-600' }
                  ].map((action, index) => (
                    <Link
                      key={index}
                      href={action.href}
                      className="group p-4 bg-gray-800/50 hover:bg-gray-800/70 border border-gray-700 hover:border-gray-600 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
                    >
                      <div className={`w-10 h-10 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                        <action.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-white mb-1">{action.title}</h3>
                      <p className="text-sm text-gray-400">{action.desc}</p>
                    </Link>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Account Status */}
              <motion.div
                className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 backdrop-blur-sm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  Account Status
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-400">Plan</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isPro ? 'bg-yellow-500 text-black' : 'bg-gray-600 text-gray-300'}`}>
                      {isPro ? 'PRO' : 'FREE'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-400">Credits</span>
                    <button
                      onClick={() => setCreditDrawerOpen(true)}
                      className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                    >
                      {isPro ? '∞' : credits} <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {!isPro && (
                    <Link
                      href="/pricing"
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-semibold"
                    >
                      <Crown className="w-4 h-4" />
                      Upgrade to PRO
                    </Link>
                  )}
                </div>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 backdrop-blur-sm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  Recent Activity
                </h3>

                <div className="space-y-3">
                  {recentActivity.length > 0 ? (
                    recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/30">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm text-white">{activity.description}</p>
                          <p className="text-xs text-gray-400">{activity.timestamp}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-400">No recent activity</p>
                      <p className="text-xs text-gray-500 mt-1">Your activity will appear here</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Performance Insights */}
              <motion.div
                className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 backdrop-blur-sm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  Performance
                </h3>

                <div className="space-y-3">
                  {[
                    { label: 'Resume Score', value: '85%', color: 'text-green-400' },
                    { label: 'ATS Compatibility', value: '92%', color: 'text-blue-400' },
                    { label: 'Profile Views', value: dashboardStats.profileViews, color: 'text-purple-400' }
                  ].map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <span className="text-gray-400 text-sm">{metric.label}</span>
                      <span className={`font-semibold ${metric.color}`}>{metric.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Credit Drawer */}
        <CreditDrawer
          isOpen={creditDrawerOpen}
          onClose={() => setCreditDrawerOpen(false)}
        />
      </div>
    </div>
  );
}