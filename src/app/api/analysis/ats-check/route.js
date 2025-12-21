import { NextResponse } from 'next/server';
import { CreditsService } from '@/lib/credits-service';
import { withErrorHandler, APIError, ERROR_CODES } from '@/lib/api-error-handler';
import { creditProtectedMiddleware } from '@/lib/api-middleware';

/**
 * ATS Analysis Endpoint
 * Analyzes resume compatibility with Applicant Tracking Systems
 */
async function atsAnalysisHandler(request) {
  try {
    const { resumeText, jobDescription } = await request.json();

    if (!resumeText || !jobDescription) {
      throw new APIError(
        'Both resume text and job description are required',
        400,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    // Perform ATS analysis
    const analysis = await performATSAnalysis(resumeText, jobDescription);

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        timestamp: new Date().toISOString()
      },
      message: 'ATS analysis completed successfully'
    });

  } catch (error) {
    console.error('ATS analysis error:', error);
    throw error;
  }
}

/**
 * Perform ATS compatibility analysis
 */
async function performATSAnalysis(resumeText, jobDescription) {
  try {
    // Extract keywords from job description
    const jobKeywords = extractKeywords(jobDescription);
    const resumeKeywords = extractKeywords(resumeText);

    // Calculate keyword match score
    const matchedKeywords = resumeKeywords.filter(keyword =>
      jobKeywords.some(jobKeyword =>
        keyword.toLowerCase().includes(jobKeyword.toLowerCase()) ||
        jobKeyword.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    const keywordMatchScore = jobKeywords.length > 0 
      ? Math.round((matchedKeywords.length / jobKeywords.length) * 100)
      : 0;

    // Analyze resume structure
    const structureAnalysis = analyzeResumeStructure(resumeText);

    // Generate ATS compatibility score
    const atsScore = calculateATSScore(resumeText, structureAnalysis, keywordMatchScore);

    // Generate recommendations
    const recommendations = generateATSRecommendations(
      resumeText,
      jobDescription,
      matchedKeywords,
      jobKeywords,
      structureAnalysis
    );

    return {
      atsScore,
      keywordMatchScore,
      matchedKeywords: matchedKeywords.slice(0, 20), // Limit to top 20
      missingKeywords: jobKeywords.filter(keyword =>
        !matchedKeywords.some(matched =>
          matched.toLowerCase().includes(keyword.toLowerCase())
        )
      ).slice(0, 15), // Limit to top 15
      structureAnalysis,
      recommendations,
      summary: generateATSSummary(atsScore, keywordMatchScore, recommendations.length)
    };

  } catch (error) {
    console.error('Error performing ATS analysis:', error);
    throw new APIError('Failed to perform ATS analysis', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}

/**
 * Extract keywords from text
 */
function extractKeywords(text) {
  const commonKeywords = [
    // Technical Skills
    'javascript', 'python', 'java', 'typescript', 'react', 'node.js', 'angular', 'vue',
    'html', 'css', 'sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'github', 'gitlab',
    'rest api', 'graphql', 'microservices', 'devops', 'ci/cd', 'terraform', 'ansible',
    
    // Frameworks & Libraries
    'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'next.js', 'gatsby',
    'redux', 'mobx', 'webpack', 'babel', 'jest', 'cypress', 'selenium',
    
    // Methodologies
    'agile', 'scrum', 'kanban', 'tdd', 'bdd', 'pair programming', 'code review',
    
    // Soft Skills
    'leadership', 'communication', 'problem solving', 'teamwork', 'project management',
    'analytical thinking', 'creativity', 'adaptability', 'time management',
    
    // Industries & Roles
    'software engineer', 'full stack', 'frontend', 'backend', 'devops engineer',
    'data scientist', 'machine learning', 'artificial intelligence', 'ui/ux designer',
    'product manager', 'business analyst', 'quality assurance', 'system administrator'
  ];

  const textLower = text.toLowerCase();
  const foundKeywords = [];

  // Find exact matches
  commonKeywords.forEach(keyword => {
    if (textLower.includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword);
    }
  });

  // Extract additional keywords using simple patterns
  const words = text.match(/\b[A-Za-z]{3,}\b/g) || [];
  const technicalWords = words.filter(word => {
    const wordLower = word.toLowerCase();
    return (
      wordLower.endsWith('js') ||
      wordLower.endsWith('py') ||
      wordLower.includes('dev') ||
      wordLower.includes('tech') ||
      wordLower.includes('api') ||
      wordLower.includes('web') ||
      wordLower.includes('app')
    );
  });

  return [...new Set([...foundKeywords, ...technicalWords.slice(0, 10)])];
}

/**
 * Analyze resume structure for ATS compatibility
 */
function analyzeResumeStructure(resumeText) {
  const lines = resumeText.split('\n').filter(line => line.trim());
  
  const analysis = {
    hasContactInfo: false,
    hasSummary: false,
    hasExperience: false,
    hasEducation: false,
    hasSkills: false,
    formatting: {
      hasHeaders: false,
      hasBulletPoints: false,
      hasConsistentFormatting: true,
      wordCount: resumeText.split(/\s+/).length
    },
    sections: []
  };

  const textLower = resumeText.toLowerCase();

  // Check for contact information
  analysis.hasContactInfo = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(resumeText) ||
                           /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(resumeText);

  // Check for common sections
  const sectionKeywords = {
    summary: ['summary', 'objective', 'profile', 'about'],
    experience: ['experience', 'work history', 'employment', 'career'],
    education: ['education', 'academic', 'degree', 'university', 'college'],
    skills: ['skills', 'technical skills', 'competencies', 'technologies']
  };

  Object.entries(sectionKeywords).forEach(([section, keywords]) => {
    const hasSection = keywords.some(keyword => textLower.includes(keyword));
    analysis[`has${section.charAt(0).toUpperCase() + section.slice(1)}`] = hasSection;
    if (hasSection) {
      analysis.sections.push(section);
    }
  });

  // Check formatting
  analysis.formatting.hasHeaders = /^[A-Z\s]{3,}$/m.test(resumeText);
  analysis.formatting.hasBulletPoints = /[•\-\*]/.test(resumeText);

  return analysis;
}

/**
 * Calculate overall ATS compatibility score
 */
function calculateATSScore(resumeText, structureAnalysis, keywordMatchScore) {
  let score = 0;

  // Keyword matching (40% weight)
  score += keywordMatchScore * 0.4;

  // Structure completeness (30% weight)
  const structureScore = (
    (structureAnalysis.hasContactInfo ? 20 : 0) +
    (structureAnalysis.hasSummary ? 15 : 0) +
    (structureAnalysis.hasExperience ? 25 : 0) +
    (structureAnalysis.hasEducation ? 15 : 0) +
    (structureAnalysis.hasSkills ? 25 : 0)
  );
  score += structureScore * 0.3;

  // Formatting (20% weight)
  const formatScore = (
    (structureAnalysis.formatting.hasHeaders ? 25 : 0) +
    (structureAnalysis.formatting.hasBulletPoints ? 25 : 0) +
    (structureAnalysis.formatting.wordCount > 200 && structureAnalysis.formatting.wordCount < 800 ? 25 : 0) +
    (structureAnalysis.formatting.hasConsistentFormatting ? 25 : 0)
  );
  score += formatScore * 0.2;

  // Content quality (10% weight)
  const contentScore = Math.min(100, (resumeText.length / 2000) * 100);
  score += contentScore * 0.1;

  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Generate ATS improvement recommendations
 */
function generateATSRecommendations(resumeText, jobDescription, matchedKeywords, jobKeywords, structureAnalysis) {
  const recommendations = [];

  // Keyword recommendations
  const missingKeywords = jobKeywords.filter(keyword =>
    !matchedKeywords.some(matched =>
      matched.toLowerCase().includes(keyword.toLowerCase())
    )
  );

  if (missingKeywords.length > 0) {
    recommendations.push({
      type: 'keywords',
      priority: 'high',
      title: 'Add Missing Keywords',
      description: `Include these relevant keywords: ${missingKeywords.slice(0, 5).join(', ')}`,
      impact: 'Improves keyword matching score by up to 25%'
    });
  }

  // Structure recommendations
  if (!structureAnalysis.hasContactInfo) {
    recommendations.push({
      type: 'structure',
      priority: 'critical',
      title: 'Add Contact Information',
      description: 'Include your email address and phone number at the top of your resume',
      impact: 'Essential for ATS parsing and recruiter contact'
    });
  }

  if (!structureAnalysis.hasSummary) {
    recommendations.push({
      type: 'structure',
      priority: 'high',
      title: 'Add Professional Summary',
      description: 'Include a 2-3 sentence summary highlighting your key qualifications',
      impact: 'Improves ATS score and provides quick overview for recruiters'
    });
  }

  if (!structureAnalysis.hasSkills) {
    recommendations.push({
      type: 'structure',
      priority: 'high',
      title: 'Add Skills Section',
      description: 'Create a dedicated skills section with relevant technical and soft skills',
      impact: 'Significantly improves keyword matching and ATS parsing'
    });
  }

  // Formatting recommendations
  if (!structureAnalysis.formatting.hasHeaders) {
    recommendations.push({
      type: 'formatting',
      priority: 'medium',
      title: 'Use Clear Section Headers',
      description: 'Add clear headers like "EXPERIENCE", "EDUCATION", "SKILLS"',
      impact: 'Helps ATS identify and parse different resume sections'
    });
  }

  if (!structureAnalysis.formatting.hasBulletPoints) {
    recommendations.push({
      type: 'formatting',
      priority: 'medium',
      title: 'Use Bullet Points',
      description: 'Format job responsibilities and achievements as bullet points',
      impact: 'Improves readability and ATS parsing accuracy'
    });
  }

  // Content length recommendations
  if (structureAnalysis.formatting.wordCount < 200) {
    recommendations.push({
      type: 'content',
      priority: 'high',
      title: 'Expand Resume Content',
      description: 'Add more details about your experience, skills, and achievements',
      impact: 'Provides more opportunities for keyword matching'
    });
  } else if (structureAnalysis.formatting.wordCount > 800) {
    recommendations.push({
      type: 'content',
      priority: 'medium',
      title: 'Optimize Resume Length',
      description: 'Consider condensing content to focus on most relevant information',
      impact: 'Improves readability while maintaining keyword density'
    });
  }

  return recommendations.slice(0, 8); // Limit to top 8 recommendations
}

/**
 * Generate ATS analysis summary
 */
function generateATSSummary(atsScore, keywordMatchScore, recommendationCount) {
  let summary = '';

  if (atsScore >= 80) {
    summary = 'Excellent ATS compatibility! Your resume is well-optimized for applicant tracking systems.';
  } else if (atsScore >= 60) {
    summary = 'Good ATS compatibility with room for improvement. Follow the recommendations to optimize further.';
  } else if (atsScore >= 40) {
    summary = 'Moderate ATS compatibility. Several improvements needed to increase your chances of passing ATS screening.';
  } else {
    summary = 'Low ATS compatibility. Significant improvements needed to ensure your resume passes through ATS filters.';
  }

  if (keywordMatchScore < 30) {
    summary += ' Focus on incorporating more relevant keywords from the job description.';
  }

  if (recommendationCount > 5) {
    summary += ' Multiple areas need attention for optimal ATS performance.';
  }

  return summary;
}

// Export the credit-protected endpoint
export const POST = creditProtectedMiddleware(
  CreditsService.CREDIT_ACTIONS.ATS_ANALYSIS,
  1
)(withErrorHandler(atsAnalysisHandler));