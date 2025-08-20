'use client';

import { useState, useEffect, useCallback } from 'react';
import ATSSpeedometer from './ATSSpeedometer';
import ATSProgressBar from './ATSProgressBar';

const ATSAnalysis = ({ 
  resumeContent, 
  jobDescription, 
  onAnalysisComplete,
  className = "" 
}) => {
  const [analysisData, setAnalysisData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  // Mock analysis function - replace with actual API call
  const performATSAnalysis = async (resume, jobDesc) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock analysis results
    return {
      overallScore: Math.floor(Math.random() * 20) + 75, // 75-95
      atsCompatibility: Math.floor(Math.random() * 15) + 80, // 80-95
      keywordMatch: Math.floor(Math.random() * 25) + 65, // 65-90
      formatting: Math.floor(Math.random() * 10) + 85, // 85-95
      sectionsOptimization: Math.floor(Math.random() * 20) + 70, // 70-90
      readability: Math.floor(Math.random() * 15) + 78, // 78-93
      
      insights: [
        {
          type: 'strength',
          title: 'Strong Technical Keywords',
          description: 'Your resume contains relevant technical keywords that match the job requirements.',
          icon: '✓'
        },
        {
          type: 'improvement',
          title: 'Add More Action Verbs',
          description: 'Consider using more dynamic action verbs like "implemented", "optimized", "designed".',
          icon: '↗'
        },
        {
          type: 'warning',
          title: 'Missing Key Skills',
          description: 'The job description mentions "cloud architecture" which is not prominently featured.',
          icon: '!'
        },
        {
          type: 'strength',
          title: 'Excellent ATS Format',
          description: 'Your resume format is highly compatible with ATS systems.',
          icon: '✓'
        }
      ],
      
      recommendations: [
        'Add 3-5 more industry-specific keywords from the job description',
        'Include quantifiable achievements with specific metrics',
        'Ensure all section headers use standard naming conventions',
        'Consider adding a skills summary section at the top'
      ],
      
      keywordAnalysis: {
        matched: ['JavaScript', 'React', 'Node.js', 'AWS', 'Git'],
        missing: ['TypeScript', 'Docker', 'Kubernetes', 'GraphQL'],
        frequency: {
          'JavaScript': 5,
          'React': 8,
          'Node.js': 3,
          'AWS': 2,
          'Git': 1
        }
      }
    };
  };

  const runAnalysis = useCallback(async () => {
    setAnalyzing(true);
    setError(null);
    
    try {
      const results = await performATSAnalysis(resumeContent, jobDescription);
      setAnalysisData(results);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(results);
      }
    } catch (err) {
      setError('Failed to analyze resume. Please try again.');
      console.error('ATS Analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  }, [resumeContent, jobDescription, onAnalysisComplete]);

  useEffect(() => {
    if (resumeContent && jobDescription) {
      runAnalysis();
    }
  }, [resumeContent, jobDescription, runAnalysis]);

  const getInsightIcon = (type) => {
    switch (type) {
      case 'strength': return '✓';
      case 'improvement': return '↗';
      case 'warning': return '!';
      default: return '•';
    }
  };

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
          <div className="text-4xl text-red-500 font-bold">✗</div>
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">Analysis Failed</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={runAnalysis}
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
          Comprehensive analysis of your resume&apos;s compatibility with Applicant Tracking Systems
        </p>
      </div>

      {/* Overall Score */}
      <div className="text-center">
        <ATSSpeedometer
          label="Overall ATS Score"
          score={analysisData.overallScore}
          color="auto"
          icon="★"
          size="large"
          description="Your resume&apos;s overall optimization score"
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
          icon="♦"
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

      {/* Key Insights */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-foreground">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysisData.insights.map((insight, index) => (
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
        </div>
      </div>

      {/* Keyword Analysis */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Keyword Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Matched Keywords */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-green-400 flex items-center gap-2">
              <span>✓</span> Matched Keywords
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

          {/* Missing Keywords */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-orange-400 flex items-center gap-2">
              <span>!</span> Missing Keywords
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
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-4">
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

      {/* Action Button */}
      <div className="text-center pt-4">
        <button
          onClick={runAnalysis}
          className="px-8 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          ↻ Re-analyze Resume
        </button>
      </div>
    </div>
  );
};

export default ATSAnalysis;
