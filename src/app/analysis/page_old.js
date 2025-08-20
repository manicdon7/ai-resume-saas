'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import ATSOptimizer from '../../components/ATSOptimizer';
import Link from 'next/link';

export default function AnalysisPage() {
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

  const runAnalysis = async (resume, job) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/ats-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resumeContent: resume,
          jobDescription: job
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze resume');
      }

      const analysis = await response.json();
      setAnalysisData(analysis);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReAnalyze = () => {
    if (resumeContent && jobDescription) {
      runAnalysis(resumeContent, jobDescription);
    }
  };

  const handleGoBack = () => {
    router.push('/');
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreStatus = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    if (score >= 60) return 'Poor';
    return 'Needs Work';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <button
                onClick={handleGoBack}
                className="mb-6 flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="mr-2">←</span> Back to Resume Builder
              </button>
              <h1 className="text-4xl font-bold text-foreground mb-4">
                ATS Analysis
              </h1>
              <p className="text-muted-foreground">
                Analyzing your resume for ATS compatibility...
              </p>
            </div>

            {/* Loading Animation */}
            <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto relative">
                  <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  <div className="absolute inset-2 border-4 border-accent/20 border-t-accent rounded-full animate-spin animate-reverse"></div>
                  <div className="absolute inset-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Analyzing Your Resume</h3>
                  <p className="text-muted-foreground">Running comprehensive ATS optimization analysis...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <button
                onClick={handleGoBack}
                className="mb-6 flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="mr-2">←</span> Back to Resume Builder
              </button>
              <h1 className="text-4xl font-bold text-foreground mb-4">
                ATS Analysis
              </h1>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
              <div className="text-center space-y-4">
                <div className="text-4xl">❌</div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Analysis Failed</h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <div className="space-x-4">
                    <button
                      onClick={handleReAnalyze}
                      className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={handleGoBack}
                      className="px-6 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <button
                onClick={handleGoBack}
                className="mb-6 flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="mr-2">←</span> Back to Resume Builder
              </button>
              <h1 className="text-4xl font-bold text-foreground mb-4">
                ATS Analysis
              </h1>
              <p className="text-muted-foreground">No analysis data available.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <button
              onClick={handleGoBack}
              className="mb-6 flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="mr-2">←</span> Back to Resume Builder
            </button>
            
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full mb-4">
              <span className="text-3xl">🎯</span>
            </div>
            <h1 className="text-4xl font-bold text-foreground">ATS Optimization Analysis</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive analysis of your resume&apos;s compatibility with Applicant Tracking Systems
            </p>
          </div>

          {/* Overall Score */}
          <div className="text-center">
            <ATSSpeedometer
              label="Overall ATS Score"
              score={analysisData.overallScore}
              color="auto"
              icon="🏆"
              size="large"
              description={`${getScoreStatus(analysisData.overallScore)} - Your resume&apos;s overall optimization score`}
            />
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ATSSpeedometer
              label="ATS Compatibility"
              score={analysisData.atsCompatibility}
              color="auto"
              icon="🤖"
              description="Format & structure compatibility"
            />
            <ATSSpeedometer
              label="Keyword Match"
              score={analysisData.keywordMatch}
              color="auto"
              icon="🔑"
              description="Job-relevant keywords found"
            />
            <ATSSpeedometer
              label="Formatting"
              score={analysisData.formatting}
              color="auto"
              icon="📄"
              description="Clean, readable format"
            />
            <ATSSpeedometer
              label="Readability"
              score={analysisData.readability}
              color="auto"
              icon="👁️"
              description="Content clarity & flow"
            />
          </div>

          {/* Progress Bars for Secondary Metrics */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Detailed Analysis</h3>
            <ATSProgressBar
              label="Section Optimization"
              score={analysisData.sectionsOptimization}
              icon="📋"
              color="auto"
            />
            <ATSProgressBar
              label="Keyword Density"
              score={analysisData.keywordMatch}
              icon="📊"
              color="auto"
            />
          </div>

          {/* Key Insights */}
          {analysisData.insights && analysisData.insights.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-foreground">Key Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysisData.insights.map((insight, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border ${
                      insight.type === 'strength'
                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : insight.type === 'improvement'
                        ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                        : insight.type === 'warning'
                        ? 'bg-red-500/10 border-red-500/20 text-red-400'
                        : 'bg-primary/10 border-primary/20 text-primary'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{insight.icon}</span>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-foreground">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keyword Analysis */}
          {analysisData.keywordAnalysis && (
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Keyword Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Matched Keywords */}
                {analysisData.keywordAnalysis.matched && analysisData.keywordAnalysis.matched.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-green-400 flex items-center gap-2">
                      <span>✅</span> Matched Keywords
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisData.keywordAnalysis.matched.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-sm"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Keywords */}
                {analysisData.keywordAnalysis.missing && analysisData.keywordAnalysis.missing.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-orange-400 flex items-center gap-2">
                      <span>⚠️</span> Missing Keywords
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisData.keywordAnalysis.missing.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full text-sm"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysisData.recommendations && analysisData.recommendations.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Recommendations</h3>
              <div className="space-y-3">
                {analysisData.recommendations.map((recommendation, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-4 bg-muted/20 rounded-lg border border-border"
                  >
                    <span className="text-accent font-bold text-lg">{index + 1}</span>
                    <p className="text-muted-foreground">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improvement Areas */}
          {analysisData.improvementAreas && analysisData.improvementAreas.length > 0 && (
            <ATSInsights insights={analysisData.improvementAreas} />
          )}

          {/* Action Buttons */}
          <div className="text-center pt-4 space-x-4">
            <button
              onClick={handleReAnalyze}
              className="px-8 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              🔄 Re-analyze Resume
            </button>
            <button
              onClick={handleGoBack}
              className="px-8 py-3 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
            >
              Back to Resume
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
