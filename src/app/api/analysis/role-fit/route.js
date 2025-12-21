import { NextResponse } from 'next/server';
import { CreditsService } from '@/lib/credits-service';
import { withErrorHandler, APIError, ERROR_CODES } from '@/lib/api-error-handler';
import { creditProtectedMiddleware } from '@/lib/api-middleware';

/**
 * Role Fit Analysis Endpoint
 * Analyzes how well a resume matches a specific job role
 */
async function roleFitAnalysisHandler(request) {
  try {
    const { resumeText, jobDescription } = await request.json();

    if (!resumeText || !jobDescription) {
      throw new APIError(
        'Both resume text and job description are required',
        400,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    // Perform role fit analysis
    const analysis = await performRoleFitAnalysis(resumeText, jobDescription);

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        timestamp: new Date().toISOString()
      },
      message: 'Role fit analysis completed successfully'
    });

  } catch (error) {
    console.error('Role fit analysis error:', error);
    throw error;
  }
}

/**
 * Perform comprehensive role fit analysis
 */
async function performRoleFitAnalysis(resumeText, jobDescription) {
  try {
    // Extract and analyze skills
    const skillsAnalysis = analyzeSkillsMatch(resumeText, jobDescription);
    
    // Analyze experience relevance
    const experienceAnalysis = analyzeExperienceRelevance(resumeText, jobDescription);
    
    // Analyze education requirements
    const educationAnalysis = analyzeEducationMatch(resumeText, jobDescription);
    
    // Calculate overall fit score
    const overallFitScore = calculateOverallFitScore(skillsAnalysis, experienceAnalysis, educationAnalysis);
    
    // Generate detailed recommendations
    const recommendations = generateRoleFitRecommendations(
      resumeText,
      jobDescription,
      skillsAnalysis,
      experienceAnalysis,
      educationAnalysis
    );

    // Analyze role-specific requirements
    const roleRequirements = analyzeRoleRequirements(jobDescription);
    
    // Generate strengths and gaps
    const strengths = identifyStrengths(resumeText, jobDescription, skillsAnalysis);
    const gaps = identifyGaps(resumeText, jobDescription, skillsAnalysis, experienceAnalysis);

    return {
      overallFitScore,
      skillsAnalysis,
      experienceAnalysis,
      educationAnalysis,
      roleRequirements,
      strengths,
      gaps,
      recommendations,
      summary: generateRoleFitSummary(overallFitScore, strengths.length, gaps.length)
    };

  } catch (error) {
    console.error('Error performing role fit analysis:', error);
    throw new APIError('Failed to perform role fit analysis', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}

/**
 * Analyze skills match between resume and job description
 */
function analyzeSkillsMatch(resumeText, jobDescription) {
  const resumeSkills = extractSkills(resumeText);
  const requiredSkills = extractSkills(jobDescription);
  
  const matchedSkills = resumeSkills.filter(skill =>
    requiredSkills.some(reqSkill =>
      skill.toLowerCase().includes(reqSkill.toLowerCase()) ||
      reqSkill.toLowerCase().includes(skill.toLowerCase())
    )
  );

  const missingSkills = requiredSkills.filter(reqSkill =>
    !resumeSkills.some(skill =>
      skill.toLowerCase().includes(reqSkill.toLowerCase()) ||
      reqSkill.toLowerCase().includes(skill.toLowerCase())
    )
  );

  const skillsMatchScore = requiredSkills.length > 0 
    ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
    : 0;

  return {
    matchedSkills: matchedSkills.slice(0, 15),
    missingSkills: missingSkills.slice(0, 10),
    skillsMatchScore,
    totalResumeSkills: resumeSkills.length,
    totalRequiredSkills: requiredSkills.length
  };
}

/**
 * Analyze experience relevance
 */
function analyzeExperienceRelevance(resumeText, jobDescription) {
  const experienceKeywords = extractExperienceKeywords(jobDescription);
  const resumeExperience = extractExperienceFromResume(resumeText);
  
  let relevanceScore = 0;
  const matchedExperience = [];
  const missingExperience = [];

  // Check for industry experience
  const industryKeywords = ['fintech', 'healthcare', 'e-commerce', 'saas', 'startup', 'enterprise'];
  const jobIndustry = industryKeywords.find(industry => 
    jobDescription.toLowerCase().includes(industry)
  );
  
  if (jobIndustry && resumeText.toLowerCase().includes(jobIndustry)) {
    relevanceScore += 20;
    matchedExperience.push(`${jobIndustry} industry experience`);
  }

  // Check for role-specific experience
  experienceKeywords.forEach(keyword => {
    if (resumeText.toLowerCase().includes(keyword.toLowerCase())) {
      relevanceScore += 10;
      matchedExperience.push(keyword);
    } else {
      missingExperience.push(keyword);
    }
  });

  // Estimate years of experience
  const yearsOfExperience = estimateYearsOfExperience(resumeText);
  const requiredYears = extractRequiredYears(jobDescription);
  
  if (requiredYears && yearsOfExperience >= requiredYears) {
    relevanceScore += 20;
  }

  return {
    relevanceScore: Math.min(100, relevanceScore),
    matchedExperience: matchedExperience.slice(0, 10),
    missingExperience: missingExperience.slice(0, 8),
    yearsOfExperience,
    requiredYears,
    meetsExperienceRequirement: !requiredYears || yearsOfExperience >= requiredYears
  };
}

/**
 * Analyze education match
 */
function analyzeEducationMatch(resumeText, jobDescription) {
  const educationKeywords = [
    'bachelor', 'master', 'phd', 'degree', 'computer science', 'engineering',
    'business', 'mba', 'certification', 'diploma'
  ];

  const resumeEducation = [];
  const requiredEducation = [];
  
  educationKeywords.forEach(keyword => {
    if (resumeText.toLowerCase().includes(keyword)) {
      resumeEducation.push(keyword);
    }
    if (jobDescription.toLowerCase().includes(keyword)) {
      requiredEducation.push(keyword);
    }
  });

  const educationMatch = requiredEducation.filter(req =>
    resumeEducation.some(edu => edu.includes(req) || req.includes(edu))
  );

  const educationScore = requiredEducation.length > 0
    ? Math.round((educationMatch.length / requiredEducation.length) * 100)
    : 100; // If no specific education required, assume match

  return {
    educationScore,
    resumeEducation,
    requiredEducation,
    educationMatch,
    meetsEducationRequirement: educationScore >= 50
  };
}

/**
 * Calculate overall role fit score
 */
function calculateOverallFitScore(skillsAnalysis, experienceAnalysis, educationAnalysis) {
  // Weighted scoring
  const skillsWeight = 0.5;
  const experienceWeight = 0.3;
  const educationWeight = 0.2;

  const score = (
    skillsAnalysis.skillsMatchScore * skillsWeight +
    experienceAnalysis.relevanceScore * experienceWeight +
    educationAnalysis.educationScore * educationWeight
  );

  return Math.round(score);
}

/**
 * Generate role fit recommendations
 */
function generateRoleFitRecommendations(resumeText, jobDescription, skillsAnalysis, experienceAnalysis, educationAnalysis) {
  const recommendations = [];

  // Skills recommendations
  if (skillsAnalysis.missingSkills.length > 0) {
    recommendations.push({
      type: 'skills',
      priority: 'high',
      title: 'Develop Missing Skills',
      description: `Consider learning: ${skillsAnalysis.missingSkills.slice(0, 3).join(', ')}`,
      impact: 'Could improve role fit score by 15-25%',
      actionItems: skillsAnalysis.missingSkills.slice(0, 5).map(skill => 
        `Learn ${skill} through online courses or practical projects`
      )
    });
  }

  // Experience recommendations
  if (experienceAnalysis.missingExperience.length > 0) {
    recommendations.push({
      type: 'experience',
      priority: 'medium',
      title: 'Gain Relevant Experience',
      description: `Seek opportunities in: ${experienceAnalysis.missingExperience.slice(0, 2).join(', ')}`,
      impact: 'Could improve experience relevance by 20-30%',
      actionItems: experienceAnalysis.missingExperience.slice(0, 3).map(exp =>
        `Look for projects or roles involving ${exp}`
      )
    });
  }

  // Education recommendations
  if (!educationAnalysis.meetsEducationRequirement) {
    recommendations.push({
      type: 'education',
      priority: 'medium',
      title: 'Consider Additional Education',
      description: 'Explore relevant certifications or degree programs',
      impact: 'Could improve education match by 30-40%',
      actionItems: [
        'Research industry-relevant certifications',
        'Consider online degree programs',
        'Look into professional development courses'
      ]
    });
  }

  // Resume optimization recommendations
  if (skillsAnalysis.skillsMatchScore < 70) {
    recommendations.push({
      type: 'resume',
      priority: 'high',
      title: 'Optimize Resume Keywords',
      description: 'Better highlight your relevant skills and experience',
      impact: 'Could improve overall fit score by 10-20%',
      actionItems: [
        'Use keywords from the job description',
        'Quantify your achievements',
        'Highlight transferable skills'
      ]
    });
  }

  return recommendations.slice(0, 6);
}

/**
 * Identify candidate strengths
 */
function identifyStrengths(resumeText, jobDescription, skillsAnalysis) {
  const strengths = [];

  // Strong skill matches
  if (skillsAnalysis.skillsMatchScore >= 70) {
    strengths.push({
      area: 'Technical Skills',
      description: 'Strong match with required technical skills',
      details: skillsAnalysis.matchedSkills.slice(0, 5)
    });
  }

  // Leadership indicators
  const leadershipKeywords = ['lead', 'manage', 'direct', 'supervise', 'mentor', 'team'];
  const hasLeadership = leadershipKeywords.some(keyword => 
    resumeText.toLowerCase().includes(keyword)
  );
  
  if (hasLeadership && jobDescription.toLowerCase().includes('lead')) {
    strengths.push({
      area: 'Leadership',
      description: 'Demonstrated leadership experience',
      details: ['Team management', 'Project leadership', 'Mentoring experience']
    });
  }

  // Problem-solving indicators
  const problemSolvingKeywords = ['solve', 'improve', 'optimize', 'develop', 'implement'];
  const hasProblemSolving = problemSolvingKeywords.some(keyword =>
    resumeText.toLowerCase().includes(keyword)
  );

  if (hasProblemSolving) {
    strengths.push({
      area: 'Problem Solving',
      description: 'Strong problem-solving and implementation skills',
      details: ['Process improvement', 'Solution development', 'Implementation experience']
    });
  }

  return strengths.slice(0, 5);
}

/**
 * Identify gaps and areas for improvement
 */
function identifyGaps(resumeText, jobDescription, skillsAnalysis, experienceAnalysis) {
  const gaps = [];

  // Critical skill gaps
  if (skillsAnalysis.missingSkills.length > 0) {
    gaps.push({
      area: 'Technical Skills',
      severity: 'high',
      description: 'Missing key technical skills',
      details: skillsAnalysis.missingSkills.slice(0, 5),
      impact: 'May prevent consideration for the role'
    });
  }

  // Experience gaps
  if (experienceAnalysis.relevanceScore < 50) {
    gaps.push({
      area: 'Relevant Experience',
      severity: 'medium',
      description: 'Limited relevant industry or role experience',
      details: experienceAnalysis.missingExperience.slice(0, 3),
      impact: 'May require additional justification of transferable skills'
    });
  }

  // Years of experience gap
  if (experienceAnalysis.requiredYears && 
      experienceAnalysis.yearsOfExperience < experienceAnalysis.requiredYears) {
    gaps.push({
      area: 'Experience Level',
      severity: 'medium',
      description: `May need ${experienceAnalysis.requiredYears - experienceAnalysis.yearsOfExperience} more years of experience`,
      details: [`Currently: ${experienceAnalysis.yearsOfExperience} years`, `Required: ${experienceAnalysis.requiredYears} years`],
      impact: 'May not meet minimum experience requirements'
    });
  }

  return gaps.slice(0, 4);
}

/**
 * Generate role fit summary
 */
function generateRoleFitSummary(overallFitScore, strengthsCount, gapsCount) {
  let summary = '';

  if (overallFitScore >= 80) {
    summary = 'Excellent role fit! You are highly qualified for this position.';
  } else if (overallFitScore >= 60) {
    summary = 'Good role fit with some areas for improvement.';
  } else if (overallFitScore >= 40) {
    summary = 'Moderate role fit. Consider developing additional skills or experience.';
  } else {
    summary = 'Limited role fit. Significant skill or experience development may be needed.';
  }

  if (strengthsCount > 2) {
    summary += ' You have several strong qualifications that align well with the role.';
  }

  if (gapsCount > 2) {
    summary += ' Focus on addressing the identified gaps to improve your candidacy.';
  }

  return summary;
}

// Helper functions
function extractSkills(text) {
  const skillKeywords = [
    // Programming Languages
    'javascript', 'python', 'java', 'typescript', 'c++', 'c#', 'php', 'ruby', 'go', 'rust',
    'swift', 'kotlin', 'scala', 'r', 'matlab', 'sql', 'html', 'css',
    
    // Frameworks & Libraries
    'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel',
    'rails', 'next.js', 'gatsby', 'redux', 'mobx', 'jquery', 'bootstrap', 'tailwind',
    
    // Databases
    'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'sqlite', 'oracle',
    'sql server', 'cassandra', 'dynamodb',
    
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'gitlab', 'github',
    'ci/cd', 'terraform', 'ansible', 'chef', 'puppet',
    
    // Tools & Technologies
    'git', 'jira', 'confluence', 'slack', 'figma', 'sketch', 'photoshop', 'illustrator',
    'webpack', 'babel', 'jest', 'cypress', 'selenium',
    
    // Methodologies
    'agile', 'scrum', 'kanban', 'devops', 'tdd', 'bdd', 'microservices', 'rest api', 'graphql',
    
    // Soft Skills
    'leadership', 'communication', 'problem solving', 'teamwork', 'project management',
    'analytical thinking', 'creativity', 'adaptability'
  ];

  const textLower = text.toLowerCase();
  return skillKeywords.filter(skill => textLower.includes(skill.toLowerCase()));
}

function extractExperienceKeywords(jobDescription) {
  const experienceKeywords = [
    'startup', 'enterprise', 'saas', 'fintech', 'healthcare', 'e-commerce',
    'consulting', 'agency', 'product development', 'software development',
    'web development', 'mobile development', 'data analysis', 'machine learning',
    'artificial intelligence', 'cybersecurity', 'cloud computing'
  ];

  const textLower = jobDescription.toLowerCase();
  return experienceKeywords.filter(keyword => textLower.includes(keyword));
}

function extractExperienceFromResume(resumeText) {
  // Simple extraction - could be enhanced with more sophisticated parsing
  const experienceSection = resumeText.toLowerCase();
  const experiences = [];
  
  if (experienceSection.includes('software engineer')) experiences.push('Software Engineering');
  if (experienceSection.includes('full stack')) experiences.push('Full Stack Development');
  if (experienceSection.includes('frontend')) experiences.push('Frontend Development');
  if (experienceSection.includes('backend')) experiences.push('Backend Development');
  if (experienceSection.includes('devops')) experiences.push('DevOps');
  if (experienceSection.includes('data')) experiences.push('Data Analysis');
  
  return experiences;
}

function estimateYearsOfExperience(resumeText) {
  // Simple heuristic - count job positions and estimate
  const jobIndicators = resumeText.match(/\b(20\d{2})\b/g) || [];
  const uniqueYears = [...new Set(jobIndicators)];
  
  if (uniqueYears.length >= 2) {
    const years = uniqueYears.map(year => parseInt(year)).sort();
    return Math.min(15, years[years.length - 1] - years[0]); // Cap at 15 years
  }
  
  // Fallback: estimate based on content length and complexity
  const wordCount = resumeText.split(/\s+/).length;
  if (wordCount > 800) return 5;
  if (wordCount > 500) return 3;
  if (wordCount > 300) return 2;
  return 1;
}

function extractRequiredYears(jobDescription) {
  const yearMatches = jobDescription.match(/(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/i);
  return yearMatches ? parseInt(yearMatches[1]) : null;
}

function analyzeRoleRequirements(jobDescription) {
  const requirements = {
    technical: [],
    experience: [],
    education: [],
    soft: []
  };

  const textLower = jobDescription.toLowerCase();

  // Extract technical requirements
  const techKeywords = ['programming', 'coding', 'development', 'software', 'technical'];
  if (techKeywords.some(keyword => textLower.includes(keyword))) {
    requirements.technical.push('Technical programming skills');
  }

  // Extract experience requirements
  const expMatch = jobDescription.match(/(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/i);
  if (expMatch) {
    requirements.experience.push(`${expMatch[1]}+ years of experience`);
  }

  // Extract education requirements
  const eduKeywords = ['degree', 'bachelor', 'master', 'phd', 'certification'];
  eduKeywords.forEach(keyword => {
    if (textLower.includes(keyword)) {
      requirements.education.push(`${keyword.charAt(0).toUpperCase() + keyword.slice(1)} required`);
    }
  });

  // Extract soft skill requirements
  const softKeywords = ['communication', 'leadership', 'teamwork', 'problem solving'];
  softKeywords.forEach(keyword => {
    if (textLower.includes(keyword)) {
      requirements.soft.push(`${keyword.charAt(0).toUpperCase() + keyword.slice(1)} skills`);
    }
  });

  return requirements;
}

// Export the credit-protected endpoint
export const POST = creditProtectedMiddleware(
  CreditsService.CREDIT_ACTIONS.ROLE_FIT_CHECK,
  1
)(withErrorHandler(roleFitAnalysisHandler));