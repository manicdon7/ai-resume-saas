'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, TrendingUp, AlertTriangle, X, RotateCcw, Star, Target, Square, Diamond } from 'lucide-react';
import { auth } from '../../lib/firebase';
import ATSSpeedometer from './ATSSpeedometer';
import ATSProgressBar from './ATSProgressBar';

const ATSOptimizer = ({ 
  resumeContent, 
  jobDescription, 
  isPro = false,
  onAnalysisComplete,
  className = "" 
}) => {
  const [analysisData, setAnalysisData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Perform ATS analysis with API call
  const performATSAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    
    try {
      // Get Firebase auth token
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Please sign in to perform analysis');
      }
      
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/ats-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          resumeContent,
          jobDescription
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const results = await response.json();
      setAnalysisData(results);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(results);
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze resume. Please try again.');
      console.error('ATS Analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (resumeContent && jobDescription) {
      performATSAnalysis();
    }
  }, [resumeContent, jobDescription]);

  const getInsightColors = (type) => {
    switch (type) {
      case 'strength': 
        return 'bg-green-500/10 border-green-500/20 text-green-400';
      case 'improvement': 
        return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
      case 'warning': 
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      default: 
        return 'bg-primary/10 border-primary/20 text-primary';
    }
  };

  const UpgradeModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mx-auto">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-primary rounded-full"></div>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground">Unlock Advanced Analysis</h3>
          <p className="text-muted-foreground">
            Get detailed insights, keyword optimization suggestions, and section-by-section analysis with Pro.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.href = '/pricing'}
              className="w-full px-6 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              Upgrade to Pro
            </button>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="w-full px-6 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Continue with Basic
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (analyzing) {
    return (
      <div className={`bg-card border border-border rounded-2xl p-8 shadow-lg ${className}`}>
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto relative">
            <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-4 border-accent/20 border-t-accent rounded-full animate-spin animate-reverse"></div>
            <div className="absolute inset-4 bg-primary/10 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-primary rounded-full"></div>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">Analyzing Your Resume</h3>
            <p className="text-muted-foreground">Running comprehensive ATS optimization analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-card border border-border rounded-2xl p-8 shadow-lg ${className}`}>
        <div className="text-center space-y-4">
          <X className="w-16 h-16 text-red-500 mx-auto" />
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">Analysis Failed</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={performATSAnalysis}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return null;
  }

  return (
    <>
      <div className={`bg-card border border-border rounded-2xl p-8 shadow-lg space-y-8 ${className}`}>
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full mb-4">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-primary rounded-full"></div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-foreground">ATS Optimization Analysis</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comprehensive analysis of your resume's compatibility with Applicant Tracking Systems
          </p>
          {isPro && (
            <div className="inline-block px-3 py-1 bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-bold rounded-full">
              PRO ANALYSIS
            </div>
          )}
        </div>

        {/* Overall Score */}
        <div className="text-center">
          <ATSSpeedometer
            label="Overall ATS Score"
            score={analysisData.overallScore}
            color="auto"
            icon={Star}
            size="large"
            description="Your resume's overall optimization score"
          />
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ATSSpeedometer
            label="ATS Compatibility"
            score={analysisData.atsCompatibility}
            color="auto"
            icon="◉"
            description="Format & structure compatibility"
          />
          <ATSSpeedometer
            label="Keyword Match"
            score={analysisData.keywordMatch}
            color="auto"
            icon={Diamond}
            description="Job-relevant keywords found"
          />
          <ATSSpeedometer
            label="Formatting"
            score={analysisData.formatting}
            color="auto"
            icon="▢"
            description="Clean, readable format"
          />
          <ATSSpeedometer
            label="Readability"
            score={analysisData.readability}
            color="auto"
            icon="◈"
            description="Content clarity & flow"
          />
        </div>

        {/* Progress Bars for Secondary Metrics */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">Detailed Analysis</h3>
          <ATSProgressBar
            label="Section Optimization"
            score={analysisData.sectionsOptimization}
            icon="◎"
            color="auto"
          />
          <ATSProgressBar
            label="Keyword Density"
            score={analysisData.keywordMatch}
            icon="▨"
            color="auto"
          />
        </div>

        {/* Basic Insights for all users */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-foreground">Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysisData.insights?.slice(0, isPro ? analysisData.insights.length : 3).map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border ${getInsightColors(insight.type)}`}
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
            
            {/* Pro Teaser for Free Users */}
            {!isPro && analysisData.insights?.length > 3 && (
              <div
                className="p-4 rounded-xl border border-dashed border-primary/50 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => setShowUpgradeModal(true)}
              >
                <div className="flex items-center justify-center space-x-3 h-full">
                  <div className="text-center">
                    <div className="text-primary text-lg mb-2">+{analysisData.insights.length - 3} more insights</div>
                    <p className="text-sm text-primary font-medium">Unlock with Pro</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Keyword Analysis - Pro Feature with Teaser */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Keyword Analysis</h3>
            {!isPro && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                Upgrade for Full Analysis
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matched Keywords */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-green-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Matched Keywords
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysisData.keywordAnalysis?.matched?.slice(0, isPro ? analysisData.keywordAnalysis.matched.length : 3).map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-sm"
                  >
                    {keyword}
                  </span>
                ))}
                {!isPro && analysisData.keywordAnalysis?.matched?.length > 3 && (
                  <span
                    className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm cursor-pointer hover:bg-primary/20"
                    onClick={() => setShowUpgradeModal(true)}
                  >
                    +{analysisData.keywordAnalysis.matched.length - 3} more
                  </span>
                )}
              </div>
            </div>

            {/* Missing Keywords */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-orange-400 flex items-center gap-2">
                <span>!</span> Missing Keywords
              </h4>
              <div className="flex flex-wrap gap-2">
                {isPro ? (
                  analysisData.keywordAnalysis?.missing?.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))
                ) : (
                  <div 
                    className="px-4 py-6 bg-primary/5 border border-primary/20 rounded-lg text-center cursor-pointer hover:bg-primary/10 transition-colors w-full"
                    onClick={() => setShowUpgradeModal(true)}
                  >
                    <div className="text-primary font-medium mb-1">Unlock Missing Keywords</div>
                    <div className="text-xs text-muted-foreground">See what keywords you're missing with Pro</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Recommendations</h3>
            {!isPro && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                Get All Recommendations
              </button>
            )}
          </div>
          <div className="space-y-3">
            {analysisData.recommendations?.slice(0, isPro ? analysisData.recommendations.length : 2).map((recommendation, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-4 bg-muted/20 rounded-lg border border-border"
              >
                <span className="text-accent font-bold text-lg">{index + 1}</span>
                <p className="text-muted-foreground">{recommendation}</p>
              </div>
            ))}
            
            {!isPro && analysisData.recommendations?.length > 2 && (
              <div 
                className="flex items-center justify-center p-4 bg-primary/5 border border-primary/20 border-dashed rounded-lg cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => setShowUpgradeModal(true)}
              >
                <div className="text-center">
                  <div className="text-primary font-medium mb-1">+{analysisData.recommendations.length - 2} More Recommendations</div>
                  <div className="text-xs text-muted-foreground">Upgrade to Pro for complete analysis</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pro-only Advanced Sections */}
        {isPro && analysisData.sectionsAnalysis && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Section Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-green-400">Present Sections</h4>
                <div className="space-y-2">
                  {analysisData.sectionsAnalysis.present?.map((section, index) => (
                    <div key={index} className="flex justify-between p-2 bg-green-500/10 rounded-lg">
                      <span className="text-foreground">{section}</span>
                      <span className="text-green-400 text-sm">
                        {analysisData.sectionsAnalysis.scores?.[section] || 'N/A'}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-orange-400">Missing Sections</h4>
                <div className="space-y-2">
                  {analysisData.sectionsAnalysis.missing?.map((section, index) => (
                    <div key={index} className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                      {section}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button
            onClick={performATSAnalysis}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            ↻ Re-analyze Resume
          </button>
          {!isPro && (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-8 py-3 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-600/10 transition-colors font-medium"
            >
              Upgrade to Pro
            </button>
          )}
        </div>
      </div>
      
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Upgrade to Pro</h3>
            <p className="text-gray-300 mb-6">Get unlimited ATS analysis and advanced features with Pro.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => window.open('/pricing', '_blank')}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ATSOptimizer;
