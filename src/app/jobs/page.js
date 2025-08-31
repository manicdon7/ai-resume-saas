'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { auth } from '../../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { setRecommendedJobs, setSavedJobs, setAppliedJobs, setLoading } from '@/store/slices/jobsSlice';
import { setUser } from '@/store/slices/authSlice';
import { showToast } from '@/lib/toast-config';
import Navbar from '@/components/Navbar';
import CreditProtectedAction from '@/components/CreditProtectedAction';
import FeatureAvailabilityIndicator from '@/components/FeatureAvailabilityIndicator';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  DollarSign, 
  Building, 
  Bookmark,
  ExternalLink,
  Filter,
  Search as SearchIcon,
  Upload,
  Target,
  TrendingUp,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';

export default function JobsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const { resumeText, parsedData } = useSelector(state => state.resume);
  const { recommendedJobs, savedJobs, appliedJobs, loading } = useSelector(state => state.jobs);
  const { isFeatureAvailable, getFeatureStatus } = useFeatureAccess();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    location: '',
    experience: '',
    salary: '',
    jobType: '',
    remote: false
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        dispatch(setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName
        }));
      } else {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, [dispatch, router]);

  const fetchRecommendedJobs = async () => {
    if (!resumeText) {
      showToast('Please upload your resume first', 'error');
      return;
    }

    dispatch(setLoading(true));
    try {
      const response = await fetch('/api/search-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeContent: resumeText,
          location: selectedFilters.location,
          experience: selectedFilters.experience,
          remote: selectedFilters.remote,
          query: searchQuery
        }),
      });

      if (response.ok) {
        const data = await response.json();
        dispatch(setRecommendedJobs(data.jobs || []));
        showToast(`Found ${data.jobs?.length || 0} job recommendations`, 'success');
      } else {
        showToast('Failed to fetch job recommendations', 'error');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      showToast('Error fetching job recommendations', 'error');
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    if (user && resumeText) {
      fetchRecommendedJobs();
    }
  }, [user, resumeText]);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
      showToast('Error signing out', 'error');
    }
  };

  const handleSearch = () => {
    fetchRecommendedJobs();
  };

  const handleSaveJob = async (job) => {
    try {
      const newSavedJobs = [...savedJobs, job];
      dispatch(setSavedJobs(newSavedJobs));
      showToast('Job saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving job:', error);
      showToast('Failed to save job', 'error');
    }
  };

  const handleApplyJob = async (job) => {
    try {
      const newAppliedJobs = [...appliedJobs, job];
      dispatch(setAppliedJobs(newAppliedJobs));
      showToast('Application submitted successfully!', 'success');
      window.open(job.url, '_blank');
    } catch (error) {
      console.error('Error applying to job:', error);
      showToast('Failed to apply to job', 'error');
    }
  };

  const isJobSaved = (jobId) => {
    return savedJobs.some(job => job.id === jobId);
  };

  const isJobApplied = (jobId) => {
    return appliedJobs.some(job => job.id === jobId);
  };

  const JobCard = ({ job }) => {
    const saved = isJobSaved(job.id);
    const applied = isJobApplied(job.id);

    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{job.title}</h3>
              <p className="text-gray-400">{job.company}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSaveJob(job)}
              disabled={saved}
              className={`p-2 rounded-lg transition-colors ${
                saved 
                  ? 'bg-green-900/30 text-green-400' 
                  : 'hover:bg-gray-700/50 text-gray-400 hover:text-white'
              }`}
            >
              {saved ? <CheckCircle className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleApplyJob(job)}
              disabled={applied}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {job.location && (
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <MapPin className="w-3 h-3" />
              <span>{job.location}</span>
            </div>
          )}
          {job.salary && (
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <DollarSign className="w-3 h-3" />
              <span>{job.salary}</span>
            </div>
          )}
          {job.type && (
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{job.type}</span>
            </div>
          )}
          {job.matchScore && (
            <div className="flex items-center gap-1 text-sm text-green-400">
              <Target className="w-3 h-3" />
              <span>{job.matchScore}% match</span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-400 mb-4 line-clamp-3">
          {job.description}
        </p>

        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {job.skills.slice(0, 5).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-purple-900/30 text-purple-400 text-xs rounded-md"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 5 && (
              <span className="px-2 py-1 bg-gray-700/50 text-gray-400 text-xs rounded-md">
                +{job.skills.length - 5} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{job.postedDate || 'Recently posted'}</span>
          </div>
          <button
            onClick={() => handleApplyJob(job)}
            disabled={applied}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              applied
                ? 'bg-green-900/30 text-green-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-purple-500/25'
            }`}
          >
            {applied ? 'Applied' : 'Apply Now'}
          </button>
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Please sign in</h2>
          <button
            onClick={() => router.push('/')}
            className="text-purple-400 hover:text-purple-300 hover:underline transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-blue-900/10 to-black" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10">
        <Navbar user={user} onSignOut={handleSignOut} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with Resume Status */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="flex items-center gap-4 mb-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.button
                onClick={() => router.back()}
                className="p-3 hover:bg-gray-700/50 rounded-xl transition-all duration-200 shadow-sm border border-gray-600"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </motion.button>
              <div className="flex-1">
                <motion.h1 
                  className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-shine"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  Job Recommendations
                </motion.h1>
                <motion.p 
                  className="text-gray-300 text-lg mt-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  AI-powered job matches tailored to your profile
                </motion.p>
              </div>
            </motion.div>

            {/* Resume Status Card */}
            {resumeText && (
              <motion.div 
                className="bg-gradient-to-br from-emerald-900/20 to-blue-900/20 border border-emerald-700/50 rounded-2xl p-6 shadow-lg backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <CheckCircle className="w-7 h-7 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Resume Active</h3>
                      <p className="text-gray-300">
                        {parsedData?.name ? `${parsedData.name}'s profile` : 'Your profile'} is optimized for matching
                      </p>
                      {parsedData?.skills && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {parsedData.skills.slice(0, 4).map((skill, index) => (
                            <span key={index} className="px-3 py-1.5 bg-gray-800/80 text-emerald-300 text-sm font-medium rounded-lg border border-emerald-700 shadow-sm">
                              {skill}
                            </span>
                          ))}
                          {parsedData.skills.length > 4 && (
                            <span className="px-3 py-1.5 bg-gray-700 text-gray-300 text-sm rounded-lg border border-gray-600">
                              +{parsedData.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="px-5 py-2.5 text-sm bg-gray-800/80 text-gray-300 rounded-xl hover:bg-gray-700 transition-all duration-200 border border-gray-600 shadow-sm font-medium"
                    >
                      Update Resume
                    </button>
                    <button
                      onClick={fetchRecommendedJobs}
                      disabled={loading}
                      className="px-5 py-2.5 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-purple-500/25 font-medium"
                    >
                      {loading ? 'Refreshing...' : 'Refresh Jobs'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {!resumeText ? (
            <div className="text-center py-16">
              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-10 max-w-lg mx-auto shadow-xl backdrop-blur-sm">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Upload Your Resume</h2>
                <p className="text-gray-300 mb-6 text-lg">
                  Get personalized job recommendations by uploading your resume first.
                </p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-purple-500/25 font-medium text-lg"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Search and Filters */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 mb-8 shadow-lg">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search jobs by title, company, or keywords..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="px-5 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200 flex items-center gap-2 border border-slate-200 dark:border-slate-600 font-medium"
                    >
                      <Filter className="w-4 h-4" />
                      Filters
                    </button>
                    <CreditProtectedAction 
                      action="job_search"
                      requiredCredits={1}
                      showUpgradePrompt={true}
                    >
                      <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 flex items-center gap-2 shadow-lg font-medium"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <SearchIcon className="w-4 h-4" />
                        )}
                        Search
                        <FeatureAvailabilityIndicator 
                          featureName="jobSearch"
                          size="small"
                          className="ml-2"
                        />
                      </button>
                    </CreditProtectedAction>
                  </div>
                </div>

                {showFilters && (
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          placeholder="City, State"
                          value={selectedFilters.location}
                          onChange={(e) => setSelectedFilters({...selectedFilters, location: e.target.value})}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Experience Level
                        </label>
                        <select
                          value={selectedFilters.experience}
                          onChange={(e) => setSelectedFilters({...selectedFilters, experience: e.target.value})}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="">Any</option>
                          <option value="entry">Entry Level</option>
                          <option value="mid">Mid Level</option>
                          <option value="senior">Senior Level</option>
                          <option value="executive">Executive</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Job Type
                        </label>
                        <select
                          value={selectedFilters.jobType}
                          onChange={(e) => setSelectedFilters({...selectedFilters, jobType: e.target.value})}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="">Any</option>
                          <option value="full-time">Full-time</option>
                          <option value="part-time">Part-time</option>
                          <option value="contract">Contract</option>
                          <option value="freelance">Freelance</option>
                        </select>
                      </div>
                      <div className="flex items-center pt-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedFilters.remote}
                            onChange={(e) => setSelectedFilters({...selectedFilters, remote: e.target.checked})}
                            className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500 focus:ring-2"
                          />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Remote Only</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Job Stats */}
              {recommendedJobs.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{recommendedJobs.length}</p>
                        <p className="text-sm text-muted-foreground">Job Matches</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{appliedJobs.length}</p>
                        <p className="text-sm text-muted-foreground">Applied</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Bookmark className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{savedJobs.length}</p>
                        <p className="text-sm text-muted-foreground">Saved</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Job Listings */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Finding the best job matches for you...</p>
                </div>
              ) : recommendedJobs.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {recommendedJobs.map((job, index) => (
                    <JobCard key={job.id || index} job={job} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-card border border-border rounded-xl p-8 max-w-md mx-auto">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h2 className="text-xl font-semibold text-foreground mb-2">No Jobs Found</h2>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your search criteria or upload a more detailed resume
                    </p>
                    <button
                      onClick={fetchRecommendedJobs}
                      className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Search Again
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
