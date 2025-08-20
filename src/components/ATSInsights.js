'use client';

import { useState } from 'react';

const ATSInsights = ({ insights = [], recommendations = [], className = "" }) => {
  const [expandedInsights, setExpandedInsights] = useState(new Set());
  const [completedRecommendations, setCompletedRecommendations] = useState(new Set());

  const toggleInsight = (index) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedInsights(newExpanded);
  };

  const toggleRecommendation = (index) => {
    const newCompleted = new Set(completedRecommendations);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedRecommendations(newCompleted);
  };

  const getInsightColors = (type) => {
    switch (type) {
      case 'strength': 
        return {
          bg: 'bg-green-500/10 hover:bg-green-500/20',
          border: 'border-green-500/20 hover:border-green-500/40',
          text: 'text-green-400',
          icon: 'text-green-400'
        };
      case 'improvement': 
        return {
          bg: 'bg-orange-500/10 hover:bg-orange-500/20',
          border: 'border-orange-500/20 hover:border-orange-500/40',
          text: 'text-orange-400',
          icon: 'text-orange-400'
        };
      case 'warning': 
        return {
          bg: 'bg-red-500/10 hover:bg-red-500/20',
          border: 'border-red-500/20 hover:border-red-500/40',
          text: 'text-red-400',
          icon: 'text-red-400'
        };
      default: 
        return {
          bg: 'bg-primary/10 hover:bg-primary/20',
          border: 'border-primary/20 hover:border-primary/40',
          text: 'text-primary',
          icon: 'text-primary'
        };
    }
  };

  const getPriorityBadge = (type) => {
    switch (type) {
      case 'warning':
        return { label: 'High Priority', color: 'bg-red-500/20 text-red-300 border-red-500/30' };
      case 'improvement':
        return { label: 'Medium Priority', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' };
      case 'strength':
        return { label: 'Maintain', color: 'bg-green-500/20 text-green-300 border-green-500/30' };
      default:
        return { label: 'Info', color: 'bg-primary/20 text-primary-300 border-primary/30' };
    }
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Interactive Insights */}
      {insights.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            Smart Insights
            <span className="text-sm font-normal text-muted-foreground">({insights.length} findings)</span>
          </h3>
          
          <div className="space-y-4">
            {insights.map((insight, index) => {
              const colors = getInsightColors(insight.type);
              const priority = getPriorityBadge(insight.type);
              const isExpanded = expandedInsights.has(index);
              
              return (
                <div
                  key={index}
                  className={`${colors.bg} ${colors.border} border rounded-xl transition-all duration-300 cursor-pointer overflow-hidden`}
                  onClick={() => toggleInsight(index)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <span className={`text-2xl ${colors.icon}`}>{insight.icon}</span>
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h4 className="font-semibold text-foreground text-lg">{insight.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs border ${priority.color}`}>
                              {priority.label}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {insight.description}
                          </p>
                          
                          {/* Additional details when expanded */}
                          {isExpanded && insight.details && (
                            <div className="mt-4 p-4 bg-background/50 rounded-lg border border-border/50">
                              <h5 className="font-medium text-foreground mb-2 text-sm flex items-center gap-2">
                                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Action Items:
                              </h5>
                              <ul className="space-y-2">
                                {insight.details.map((detail, detailIndex) => (
                                  <li key={detailIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="text-accent">•</span>
                                    {detail}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Sample action items for demo */}
                          {isExpanded && !insight.details && (
                            <div className="mt-4 p-4 bg-background/50 rounded-lg border border-border/50">
                              <h5 className="font-medium text-foreground mb-2 text-sm flex items-center gap-2">
                                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                Quick Actions:
                              </h5>
                              <div className="space-y-2">
                                {insight.type === 'improvement' && (
                                  <div className="text-sm text-muted-foreground">
                                    <span className="text-accent">•</span> Review similar job postings for keyword trends
                                    <br />
                                    <span className="text-accent">•</span> Use action verbs like &quot;achieved&quot;, &quot;implemented&quot;, &quot;led&quot;
                                    <br />
                                    <span className="text-accent">•</span> Quantify your achievements with specific numbers
                                  </div>
                                )}
                                {insight.type === 'warning' && (
                                  <div className="text-sm text-muted-foreground">
                                    <span className="text-accent">•</span> Add the missing skill to your skills section
                                    <br />
                                    <span className="text-accent">•</span> Include related experience in your job descriptions
                                    <br />
                                    <span className="text-accent">•</span> Consider taking a course to gain this skill
                                  </div>
                                )}
                                {insight.type === 'strength' && (
                                  <div className="text-sm text-muted-foreground">
                                    <span className="text-accent">•</span> Continue highlighting this strength
                                    <br />
                                    <span className="text-accent">•</span> Provide specific examples of this skill in action
                                    <br />
                                    <span className="text-accent">•</span> Consider mentioning it in your summary
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Expand/Collapse Arrow */}
                      <button 
                        className={`${colors.text} transition-transform duration-300 ml-2 ${isExpanded ? 'rotate-180' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleInsight(index);
                        }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Recommendations Checklist */}
      {recommendations.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              Action Checklist
            </h3>
            <div className="text-sm text-muted-foreground">
              {completedRecommendations.size}/{recommendations.length} completed
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-accent to-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(completedRecommendations.size / recommendations.length) * 100}%` }}
            >
              <div className="h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            </div>
          </div>
          
          <div className="space-y-3">
            {recommendations.map((recommendation, index) => {
              const isCompleted = completedRecommendations.has(index);
              
              return (
                <div
                  key={index}
                  className={`flex items-start space-x-4 p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                    isCompleted 
                      ? 'bg-green-500/10 border-green-500/20 opacity-75' 
                      : 'bg-card/50 border-border hover:bg-muted/20'
                  }`}
                  onClick={() => toggleRecommendation(index)}
                >
                  {/* Checkbox */}
                  <button
                    className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                      isCompleted
                        ? 'bg-green-500 border-green-500'
                        : 'border-muted-foreground hover:border-accent'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRecommendation(index);
                    }}
                  >
                    {isCompleted && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Priority Number */}
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                    isCompleted 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-accent/20 text-accent'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Recommendation Text */}
                  <p className={`flex-1 leading-relaxed transition-all duration-200 ${
                    isCompleted 
                      ? 'text-muted-foreground line-through' 
                      : 'text-foreground'
                  }`}>
                    {recommendation}
                  </p>

                  {/* Completion Badge */}
                  {isCompleted && (
                    <div className="flex items-center gap-1 text-green-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs font-medium">Done</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Completion Celebration */}
          {completedRecommendations.size === recommendations.length && recommendations.length > 0 && (
            <div className="text-center p-6 bg-gradient-to-r from-green-500/10 to-accent/10 border border-green-500/20 rounded-xl">
              <div className="text-4xl mb-2">
                <svg className="w-12 h-12 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-1">Congratulations!</h4>
              <p className="text-sm text-muted-foreground">
                You&apos;ve completed all ATS optimization recommendations. Your resume is now highly optimized!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ATSInsights;
