'use client';

import { useState } from 'react';
import { 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Clock, 
  Building, 
  Bookmark, 
  BookmarkCheck, 
  ExternalLink,
  Calendar,
  Users
} from 'lucide-react';
import JobApplicationModal from './JobApplicationModal';

export default function JobListings({ jobs, onSaveJob, onApplyJob, user }) {
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  const formatSalary = (salary) => {
    if (!salary) return 'Not specified';
    if (salary.min && salary.max) {
      return `$${(salary.min / 1000).toFixed(0)}k - $${(salary.max / 1000).toFixed(0)}k`;
    }
    if (salary.min) {
      return `From $${(salary.min / 1000).toFixed(0)}k`;
    }
    if (salary.max) {
      return `Up to $${(salary.max / 1000).toFixed(0)}k`;
    }
    return salary;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const handleSave = (job) => {
    onSaveJob(job.id);
  };

  const handleApply = (job) => {
    setSelectedJob(job);
    setShowApplicationModal(true);
  };

  const handleApplicationSubmit = (applicationData) => {
    onApplyJob(selectedJob.id, applicationData);
    setShowApplicationModal(false);
    setSelectedJob(null);
  };

  const getJobTypeColor = (type) => {
    const colors = {
      'full-time': 'bg-blue-100 text-blue-800',
      'part-time': 'bg-green-100 text-green-800',
      'contract': 'bg-purple-100 text-purple-800',
      'internship': 'bg-yellow-100 text-yellow-800',
      'remote': 'bg-indigo-100 text-indigo-800'
    };
    return colors[type?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
        <p className="text-gray-600">
          Try adjusting your search criteria or upload your resume to get personalized recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          {jobs.length} {jobs.length === 1 ? 'Job' : 'Jobs'} Found
        </h2>
        <div className="text-sm text-muted-foreground">
          Based on your search criteria
        </div>
      </div>

      <div className="space-y-4">
        {jobs.map((job) => (
          <div 
            key={job.id}
            className="bg-background/80 backdrop-blur-sm rounded-xl border border-border/30 p-6 hover:shadow-lg transition-all duration-200 hover:border-primary/30"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-foreground hover:text-primary transition-colors cursor-pointer">
                    {job.title}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getJobTypeColor(job.type)}`}>
                    {job.type}
                  </span>
                  {job.remote && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                      Remote
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                  {job.company && (
                    <div className="flex items-center space-x-1">
                      <Building className="w-4 h-4" />
                      <span>{job.company}</span>
                    </div>
                  )}
                  {job.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location}</span>
                    </div>
                  )}
                  {job.postedDate && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(job.postedDate)}</span>
                    </div>
                  )}
                </div>

                {job.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                    {job.description}
                  </p>
                )}

                {job.skills && job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {job.skills.slice(0, 5).map((skill, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 5 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                        +{job.skills.length - 5} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center space-x-4 text-sm">
                  {job.salary && (
                    <div className="flex items-center space-x-1 text-green-600 font-medium">
                      <DollarSign className="w-4 h-4" />
                      <span>{formatSalary(job.salary)}</span>
                    </div>
                  )}
                  
                  {job.experience && (
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Briefcase className="w-4 h-4" />
                      <span>{job.experience}</span>
                    </div>
                  )}

                  {job.applicants && (
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{job.applicants} applicants</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                <button
                  onClick={() => handleSave(job)}
                  className={`p-2 rounded-lg transition-colors ${
                    job.saved 
                      ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={job.saved ? 'Saved' : 'Save job'}
                >
                  {job.saved ? (
                    <BookmarkCheck className="w-4 h-4" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={() => handleApply(job)}
                  disabled={job.applied}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    job.applied
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  {job.applied ? 'Applied' : 'Apply'}
                </button>

                {job.url && (
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    title="View on original site"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedJob && (
        <JobApplicationModal
          isOpen={showApplicationModal}
          onClose={() => {
            setShowApplicationModal(false);
            setSelectedJob(null);
          }}
          job={selectedJob}
          onSubmit={handleApplicationSubmit}
        />
      )}
    </div>
  );
}