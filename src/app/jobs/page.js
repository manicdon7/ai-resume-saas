"use client";

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import Navbar from '@/components/Navbar';
import JobSearchForm from '@/components/JobSearchForm';
import JobListings from '@/components/JobListings';
import ResumeUploader from '@/components/ResumeUploader';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

export default function JobsPage() {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedResume, setUploadedResume] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    experience: '',
    salary: '',
    remote: false
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleResumeUpload = async (file) => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('resume', file);
      
      const response = await fetch('/api/jobs/upload-resume', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to upload resume');
      }

      const data = await response.json();
      setUploadedResume(data);
      
      // Automatically search for jobs based on resume
      if (data.extractedSkills && data.extractedSkills.length > 0) {
        await searchJobs({ skills: data.extractedSkills });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const searchJobs = async (searchParams = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams({
        query: searchQuery || searchParams.skills?.join(' ') || '',
        location: filters.location,
        experience: filters.experience,
        salary: filters.salary,
        remote: filters.remote,
        ...searchParams
      });

      const response = await fetch(`/api/jobs/search?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err) {
      setError(err.message);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveJob = async (jobId) => {
    try {
      const response = await fetch('/api/jobs/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({ jobId })
      });

      if (!response.ok) {
        throw new Error('Failed to save job');
      }

      // Update local state
      setJobs(jobs.map(job => 
        job.id === jobId ? { ...job, saved: true } : job
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleApplyJob = async (jobId, applicationData) => {
    try {
      const response = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({ jobId, ...applicationData })
      });

      if (!response.ok) {
        throw new Error('Failed to apply for job');
      }

      // Update local state
      setJobs(jobs.map(job => 
        job.id === jobId ? { ...job, applied: true } : job
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <Navbar user={user} onSignOut={handleSignOut} />
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Find Your Dream Job
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload your resume and let our AI find the perfect job matches for your skills and experience.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar - Resume Upload & Filters */}
            <div className="lg:col-span-1">
              <div className="bg-background/80 backdrop-blur-sm rounded-xl border border-border/30 p-6 sticky top-24">
                <h2 className="text-xl font-semibold text-foreground mb-4">Resume Upload</h2>
                <ResumeUploader 
                  onUpload={handleResumeUpload}
                  uploadedResume={uploadedResume}
                />
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Search Filters</h3>
                  <JobSearchForm 
                    filters={filters}
                    onFiltersChange={setFilters}
                    onSearch={searchJobs}
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                  />
                </div>
              </div>
            </div>

            {/* Right Content - Job Listings */}
            <div className="lg:col-span-2">
              {loading && <LoadingSpinner />}
              {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
              
              {!loading && !error && (
                <JobListings 
                  jobs={jobs}
                  onSaveJob={handleSaveJob}
                  onApplyJob={handleApplyJob}
                  user={user}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}