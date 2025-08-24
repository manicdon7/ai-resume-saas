'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { setUser, setProStatus, setCredits, signOut as reduxSignOut } from '../../store/slices/authSlice';
import { setParsedData, setResumeText, clearResume } from '../../store/slices/resumeSlice';
import { 
  FileText, 
  Upload, 
  BarChart3, 
  Target, 
  Briefcase, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Crown,
  Zap,
  Users,
  Trash2,
  Send
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, isAuthenticated, isPro, credits, loading } = useSelector(state => state.auth);
  const { parsedData, resumeText, uploadedAt } = useSelector(state => state.resume);
  const [recentActivity, setRecentActivity] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');

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

  const fetchUserData = async (currentUser) => {
    try {
      const token = await currentUser.getIdToken();
      
      // Set default credits for now since API endpoints don't exist
      dispatch(setCredits(100));
      
      // Mock activity data
      setRecentActivity([
        { type: 'resume_upload', date: new Date().toISOString(), description: 'Resume uploaded' },
        { type: 'job_search', date: new Date().toISOString(), description: 'Job search performed' }
      ]);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

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
        await parseResumeData(data.text);
        toast.success(`Successfully uploaded ${file.name}`);
      } else {
        toast.error('Failed to extract text from file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const parseResumeData = async (text) => {
    try {
      const response = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Parse this resume and extract structured data in JSON format. Return only valid JSON with these fields:
            {
              "name": "Full Name",
              "email": "email@example.com", 
              "phone": "phone number",
              "location": "city, state",
              "summary": "professional summary",
              "experience": [{"title": "Job Title", "company": "Company", "duration": "2020-2023", "description": "Job description"}],
              "education": [{"degree": "Degree", "school": "School", "year": "2020"}],
              "skills": ["skill1", "skill2"]
            }
            
            Resume text: ${text.substring(0, 2000)}`
          }],
          model: 'openai',
        }),
      });

      if (response.ok) {
        const result = await response.text();
        try {
          const cleanJson = result.replace(/```json|```/g, '').trim();
          const parsedData = JSON.parse(cleanJson);
          dispatch(setParsedData(parsedData));
          dispatch(setResumeText(text));
          toast.success('Resume parsed and loaded successfully!');
          return parsedData;
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          toast.error('Failed to parse resume data');
        }
      }
    } catch (error) {
      console.error('Resume parsing error:', error);
      toast.error('Error parsing resume');
    }
  };

  const extractName = (text) => {
    const lines = text.split('\n');
    return lines[0]?.trim() || 'Professional Candidate';
  };

  const extractEmail = (text) => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = text.match(emailRegex);
    return match ? match[0] : '';
  };

  const extractPhone = (text) => {
    const phoneRegex = /\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}/;
    const match = text.match(phoneRegex);
    return match ? match[0] : '';
  };

  const extractSkills = (text) => {
    const skillsSection = text.toLowerCase();
    const commonSkills = ['javascript', 'python', 'react', 'node.js', 'sql', 'html', 'css', 'java', 'c++', 'git'];
    return commonSkills.filter(skill => skillsSection.includes(skill));
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

  const statsData = [
    {
      title: 'Resume Score',
      value: resumeText ? '85%' : 'N/A',
      icon: BarChart3,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      locked: !isPro && !resumeText
    },
    {
      title: 'ATS Compatibility',
      value: resumeText ? '92%' : 'N/A',
      icon: Target,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      locked: !isPro
    },
    {
      title: 'Credits Remaining',
      value: credits,
      icon: Zap,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      locked: false
    },
    {
      title: 'Jobs Applied',
      value: recentActivity.filter(a => a.type === 'job_application').length,
      icon: Briefcase,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      locked: !isPro
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      <Navbar user={user} onSignOut={handleSignOut} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>
          <p className="text-gray-300 text-lg">Manage your resume and track your job applications</p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {parsedData?.name || user?.displayName || 'Professional'}!
            </h1>
            <p className="text-muted-foreground">Here's your career optimization dashboard</p>
          </div>
          {isPro && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-lg">
              <Crown className="w-5 h-5" />
              <span className="font-semibold">PRO</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
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

          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-300">
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

          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Resume Upload & Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Resume Upload Section */}
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
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        <p className="text-sm text-muted-foreground">Processing {fileName}...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <Upload className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                        <h3 className="text-xl font-semibold text-white mb-3">
                          {resumeText ? 'Update Your Resume' : 'Upload Your Resume'}
                        </h3>
                        <p className="text-gray-300 mb-6">
                          {resumeText
                            ? 'Replace your current resume with a new version'
                            : 'Upload your resume in PDF, DOC, or DOCX format'}
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium text-foreground">Resume Uploaded</p>
                        <p className="text-sm text-muted-foreground">
                          {uploadedAt ? new Date(uploadedAt).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          dispatch(clearResume());
                          setFileName('');
                          toast.success('Resume removed successfully');
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                      <button
                        onClick={() => document.getElementById('resume-upload').click()}
                        className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Update
                      </button>
                      <Link
                        href="/analysis"
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Analyze
                      </Link>
                    </div>
                  </div>

                  {/* Personal Info */}
                  {parsedData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/20 rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Name</p>
                        <p className="text-foreground">{parsedData.name || 'Not extracted'}</p>
                      </div>
                      <div className="p-4 bg-muted/20 rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                        <p className="text-foreground">{parsedData.email || 'Not extracted'}</p>
                      </div>
                      <div className="p-4 bg-muted/20 rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Phone</p>
                        <p className="text-foreground">{parsedData.phone || 'Not extracted'}</p>
                      </div>
                      <div className="p-4 bg-muted/20 rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Skills</p>
                        <p className="text-foreground">
                          {parsedData.skills?.length ? parsedData.skills.join(', ') : 'Not extracted'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/cover-letter"
                  className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <FileText className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="font-medium text-foreground">Cover Letter</h3>
                  <p className="text-sm text-muted-foreground">Generate & edit cover letters</p>
                </Link>
                <Link
                  href="/jobs"
                  className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <Briefcase className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="font-medium text-foreground">Find Jobs</h3>
                  <p className="text-sm text-muted-foreground">Discover matching opportunities</p>
                </Link>
                <Link
                  href="/analysis"
                  className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <Target className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="font-medium text-foreground">ATS Analysis</h3>
                  <p className="text-sm text-muted-foreground">Optimize for ATS systems</p>
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Account Status */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Account Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isPro ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isPro ? 'PRO' : 'FREE'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Credits</span>
                  <span className="text-sm font-medium text-foreground">{credits}</span>
                </div>
                {!isPro && (
                  <Link
                    href="/pricing"
                    className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-center block"
                  >
                    Upgrade to PRO
                  </Link>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
