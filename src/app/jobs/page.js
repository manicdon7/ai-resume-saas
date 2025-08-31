'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { setUser } from '@/store/slices/authSlice';
import { showToast } from '@/lib/toast-config';
import Navbar from '@/components/Navbar';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  DollarSign, 
  Building, 
  ExternalLink,
  Filter,
  Search as SearchIcon,
  Upload,
  Target,
  TrendingUp,
  CheckCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  Calendar,
  Globe,
  Zap,
  Heart,
  Share2,
  MoreVertical,
  RefreshCw
} from 'lucide-react';

export default function JobsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { resumeText, parsedData } = useSelector(state => state.resume);
  
  // State management
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedJobs, setSavedJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalJobs: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  // Filters
  const [filters, setFilters] = useState({
    location: '',
    jobType: '',
    experience: '',
    remote: false,
    salary: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // UI state
  const [searchMetadata, setSearchMetadata] = useState(null);
  const [lastSearchQuery, setLastSearchQuery] = useState('');

  // Auth listener
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

  // Initial job search based on resume
  const performInitialSearch = useCallback(async () => {
    if (!resumeText || !parsedData) return;
    
    setInitialLoading(true);
    
    // Generate search query from resume data
    let query = '';
    if (parsedData.skills && parsedData.skills.length > 0) {
      query = parsedData.skills.slice(0, 3).join(' ') + ' developer';
    } else {
      query = 'software developer';
    }
    
    setSearchQuery(query);
    await searchJobs(query, 1, filters);
    setInitialLoading(false);
  }, [resumeText, parsedData]);

  useEffect(() => {
    if (user && resumeText) {
      performInitialSearch();
    } else if (user) {
      setInitialLoading(false);
    }
  }, [user, resumeText, performInitialSearch]);

  // Search jobs function
  const searchJobs = async (query, page = 1, currentFilters = filters) => {
    if (!query.trim()) {
      showToast.error('Please enter a search query');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          page,
          limit: 12,
          location: currentFilters.location,
          jobType: currentFilters.jobType,
          experience: currentFilters.experience
        }),
      });

      const data = await response.json();

      if (data.success) {
        setJobs(data.jobs);
        setPagination(data.pagination);
        setSearchMetadata(data.metadata);
        setLastSearchQuery(query);
        
        if (data.jobs.length === 0) {
          showToast.info('No jobs found. Try adjusting your search criteria.');
        } else {
          showToast.success(`Found ${data.jobs.length} job opportunities`);
        }
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (error) {
      console.error('Job search error:', error);
      showToast.error('Failed to search jobs. Please try again.');
      setJobs([]);
      setPagination({
        currentPage: 1,
        totalPages: 0,
        totalJobs: 0,
        hasNextPage: false,
        hasPrevPage: false
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    searchJobs(searchQuery, 1, filters);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      searchJobs(lastSearchQuery, newPage, filters);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  // Apply filters
  const applyFilters = () => {
    if (lastSearchQuery) {
      searchJobs(lastSearchQuery, 1, filters);
    }
    setShowFilters(false);
  };

  // Clear filters
  const clearFilters = () => {
    const clearedFilters = {
      location: '',
      jobType: '',
      experience: '',
      remote: false,
      salary: ''
    };
    setFilters(clearedFilters);
    if (lastSearchQuery) {
      searchJobs(lastSearchQuery, 1, clearedFilters);
    }
  };

  // Job actions
  const handleSaveJob = (job) => {
    if (savedJobs.find(j => j.id === job.id)) {
      setSavedJobs(savedJobs.filter(j => j.id !== job.id));
      showToast.success('Job removed from saved');
    } else {
      setSavedJobs([...savedJobs, job]);
      showToast.success('Job saved successfully');
    }
  };

  const handleApplyJob = (job) => {
    if (!appliedJobs.find(j => j.id === job.id)) {
      setAppliedJobs([...appliedJobs, job]);
      showToast.success('Application submitted!');
    }
    window.open(job.url, '_blank');
  };

  const isJobSaved = (jobId) => savedJobs.some(job => job.id === jobId);
  const isJobApplied = (jobId) => appliedJobs.some(job => job.id === jobId);

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
      showToast.error('Error signing out');
    }
  };
  // Job Card Component
  const JobCard = ({ job, index }) => {
    const saved = isJobSaved(job.id);
    const applied = isJobApplied(job.id);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 backdrop-blur-sm group hover:border-gray-600"
      >
        {/* Job Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-xl flex items-center justify-center border border-purple-500/20">
              <Building className="w-7 h-7 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                {job.title}
              </h3>
              <p className="text-gray-400 font-medium">{job.company}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
                  {job.siteName}
                </span>
                {job.isUrgent && (
                  <span className="text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded-full border border-red-500/30 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Urgent
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSaveJob(job)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                saved 
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                  : 'hover:bg-gray-700/50 text-gray-400 hover:text-yellow-400 border border-transparent hover:border-gray-600'
              }`}
            >
              {saved ? <Heart className="w-4 h-4 fill-current" /> : <Heart className="w-4 h-4" />}
            </button>
            <button className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors text-gray-400 hover:text-white border border-transparent hover:border-gray-600">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors text-gray-400 hover:text-white border border-transparent hover:border-gray-600">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Job Details */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-300 bg-gray-700/30 px-3 py-1.5 rounded-lg">
            <MapPin className="w-4 h-4 text-green-400" />
            <span>{job.location}</span>
          </div>
          
          {job.salary && (
            <div className="flex items-center gap-2 text-sm text-gray-300 bg-gray-700/30 px-3 py-1.5 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span>${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-gray-300 bg-gray-700/30 px-3 py-1.5 rounded-lg">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>{job.type}</span>
          </div>
          
          {job.isRemote && (
            <div className="flex items-center gap-2 text-sm text-gray-300 bg-gray-700/30 px-3 py-1.5 rounded-lg">
              <Globe className="w-4 h-4 text-purple-400" />
              <span>Remote</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-green-300 bg-green-500/20 px-3 py-1.5 rounded-lg border border-green-500/30">
            <Target className="w-4 h-4" />
            <span>{job.matchScore}% match</span>
          </div>
        </div>

        {/* Job Description */}
        <p className="text-gray-300 text-sm leading-relaxed mb-4 line-clamp-3">
          {job.description}
        </p>

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {job.skills.slice(0, 6).map((skill, skillIndex) => (
              <span
                key={skillIndex}
                className="px-3 py-1 bg-purple-900/30 text-purple-300 text-xs rounded-full border border-purple-500/30 font-medium"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 6 && (
              <span className="px-3 py-1 bg-gray-700/50 text-gray-400 text-xs rounded-full border border-gray-600">
                +{job.skills.length - 6} more
              </span>
            )}
          </div>
        )}

        {/* Job Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(job.postedDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{job.applicants} applicants</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.open(job.url, '_blank')}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View Details
            </button>
            <button
              onClick={() => handleApplyJob(job)}
              disabled={applied}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                applied
                  ? 'bg-green-900/30 text-green-400 cursor-not-allowed border border-green-500/30'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-purple-500/25'
              }`}
            >
              {applied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Applied
                </>
              ) : (
                <>
                  <Briefcase className="w-4 h-4" />
                  Apply Now
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // Loading Component
  const LoadingCard = () => (
    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 animate-pulse">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 bg-gray-700 rounded-xl"></div>
        <div className="flex-1">
          <div className="h-6 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-32"></div>
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-8 bg-gray-700 rounded w-24"></div>
        <div className="h-8 bg-gray-700 rounded w-32"></div>
        <div className="h-8 bg-gray-700 rounded w-20"></div>
      </div>
      <div className="h-16 bg-gray-700 rounded mb-4"></div>
      <div className="flex gap-2 mb-4">
        <div className="h-6 bg-gray-700 rounded w-16"></div>
        <div className="h-6 bg-gray-700 rounded w-20"></div>
        <div className="h-6 bg-gray-700 rounded w-18"></div>
      </div>
      <div className="flex justify-between items-center pt-4 border-t border-gray-700">
        <div className="h-4 bg-gray-700 rounded w-32"></div>
        <div className="h-10 bg-gray-700 rounded w-24"></div>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
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
      </div>

      <div className="relative z-10">
        <Navbar user={user} onSignOut={handleSignOut} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.back()}
                className="p-3 hover:bg-gray-700/50 rounded-xl transition-all duration-200 border border-gray-600 hover:border-gray-500"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Job Search
                </h1>
                <p className="text-gray-300 text-lg">
                  Discover your next career opportunity
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search for jobs, companies, or skills..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full pl-12 pr-4 py-4 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-lg"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-6 py-4 rounded-xl transition-all duration-200 flex items-center gap-2 border font-medium ${
                      showFilters 
                        ? 'bg-purple-600 text-white border-purple-500' 
                        : 'bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <Filter className="w-5 h-5" />
                    Filters
                  </button>
                  
                  <button
                    onClick={handleSearch}
                    disabled={loading || !searchQuery.trim()}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg font-medium text-lg"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <SearchIcon className="w-5 h-5" />
                    )}
                    Search Jobs
                  </button>
                </div>
              </div>

              {/* Filters Panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-6 border-t border-gray-700"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          placeholder="City, State or Remote"
                          value={filters.location}
                          onChange={(e) => handleFilterChange('location', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Job Type
                        </label>
                        <select
                          value={filters.jobType}
                          onChange={(e) => handleFilterChange('jobType', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="">Any Type</option>
                          <option value="full-time">Full-time</option>
                          <option value="part-time">Part-time</option>
                          <option value="contract">Contract</option>
                          <option value="freelance">Freelance</option>
                          <option value="internship">Internship</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Experience Level
                        </label>
                        <select
                          value={filters.experience}
                          onChange={(e) => handleFilterChange('experience', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="">Any Level</option>
                          <option value="entry">Entry Level</option>
                          <option value="mid">Mid Level</option>
                          <option value="senior">Senior Level</option>
                          <option value="executive">Executive</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Salary Range
                        </label>
                        <select
                          value={filters.salary}
                          onChange={(e) => handleFilterChange('salary', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="">Any Salary</option>
                          <option value="50-75">$50k - $75k</option>
                          <option value="75-100">$75k - $100k</option>
                          <option value="100-150">$100k - $150k</option>
                          <option value="150-200">$150k - $200k</option>
                          <option value="200+">$200k+</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.remote}
                          onChange={(e) => handleFilterChange('remote', e.target.checked)}
                          className="w-5 h-5 rounded border-gray-600 text-purple-500 focus:ring-purple-500 focus:ring-2 bg-gray-900"
                        />
                        <span className="text-gray-300 font-medium">Remote jobs only</span>
                      </label>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={clearFilters}
                          className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                          Clear All
                        </button>
                        <button
                          onClick={applyFilters}
                          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                        >
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Resume Status */}
          {!resumeText && !initialLoading && (
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-500/30 rounded-2xl p-8 text-center">
                <Upload className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Upload Your Resume</h2>
                <p className="text-gray-300 mb-6">
                  Get personalized job recommendations by uploading your resume first.
                </p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-lg font-medium"
                >
                  Go to Dashboard
                </button>
              </div>
            </motion.div>
          )}

          {/* Search Results Header */}
          {(jobs.length > 0 || loading) && (
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {loading ? 'Searching...' : `${pagination.totalJobs} Jobs Found`}
                  </h2>
                  {searchMetadata && (
                    <p className="text-gray-400">
                      Search results for "{lastSearchQuery}"
                    </p>
                  )}
                </div>
                
                {!loading && jobs.length > 0 && (
                  <button
                    onClick={() => searchJobs(lastSearchQuery, pagination.currentPage, filters)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-all duration-200"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                )}
              </div>

              {/* Stats */}
              {!loading && jobs.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{pagination.totalJobs}</p>
                        <p className="text-sm text-gray-400">Total Jobs</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                        <Heart className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{savedJobs.length}</p>
                        <p className="text-sm text-gray-400">Saved Jobs</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{appliedJobs.length}</p>
                        <p className="text-sm text-gray-400">Applications</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Job Listings */}
          {initialLoading ? (
            <div className="text-center py-16">
              <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Loading Jobs</h2>
              <p className="text-gray-400">Finding the best opportunities for you...</p>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <LoadingCard key={index} />
              ))}
            </div>
          ) : jobs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {jobs.map((job, index) => (
                  <JobCard key={job.id} job={job} index={index} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <motion.div 
                  className="flex items-center justify-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="p-3 rounded-lg border border-gray-600 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white transition-all duration-200"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = i + 1;
                    const isActive = page === pagination.currentPage;
                    
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-purple-600 text-white border border-purple-500'
                            : 'border border-gray-600 hover:border-gray-500 text-gray-400 hover:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="p-3 rounded-lg border border-gray-600 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white transition-all duration-200"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </>
          ) : searchQuery && !loading ? (
            <div className="text-center py-16">
              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-12 max-w-md mx-auto">
                <TrendingUp className="w-16 h-16 mx-auto mb-6 text-gray-500" />
                <h2 className="text-2xl font-bold text-white mb-4">No Jobs Found</h2>
                <p className="text-gray-400 mb-6">
                  We couldn't find any jobs matching your criteria. Try adjusting your search terms or filters.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={clearFilters}
                    className="px-6 py-3 text-gray-300 border border-gray-600 hover:border-gray-500 rounded-lg transition-all duration-200"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={() => {
                      setSearchQuery('software developer');
                      searchJobs('software developer', 1, filters);
                    }}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    Try Popular Search
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}