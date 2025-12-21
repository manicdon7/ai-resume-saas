import { NextResponse } from 'next/server';
import { CreditsService } from '../../../lib/credits-service';

export async function POST(request) {
    try {
        // --- Credit System Start ---
        const creditResult = await CreditsService.middleware(request, CreditsService.CREDIT_ACTIONS.ATS_ANALYSIS);
        
        if (creditResult.response) {
            return creditResult.response;
        }
        
        const user = creditResult.user;
        const isPro = creditResult.isPro;
        const transaction = creditResult.transaction;
        // --- Credit System End ---

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 30000)
        );

        const requestData = await Promise.race([
            request.json(),
            timeoutPromise
        ]);

        const { resumeContent, jobDescription } = requestData;

        // Validate inputs
        if (!resumeContent || !jobDescription) {
            return NextResponse.json(
                { error: 'Both resume content and job description are required' },
                { status: 400 }
            );
        }

        if (resumeContent.length > 15000 || jobDescription.length > 10000) {
            return NextResponse.json(
                { error: 'Content too long. Resume: max 15,000 chars, Job description: max 10,000 chars' },
                { status: 400 }
            );
        }

        // Sanitize inputs
        const sanitizedResume = resumeContent.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        const sanitizedJobDesc = jobDescription.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

        // Create comprehensive ATS analysis prompt with enhanced instructions
        const prompt = `You are a senior ATS (Applicant Tracking System) specialist and resume optimization expert with 10+ years of experience. Your task is to provide a detailed, actionable analysis comparing this resume against the specific job description.

=== RESUME CONTENT ===
${sanitizedResume}

=== JOB DESCRIPTION ===
${sanitizedJobDesc}

=== ANALYSIS INSTRUCTIONS ===
1. Perform deep keyword analysis - identify exact matches, synonyms, and missing critical terms
2. Evaluate ATS parsing compatibility (formatting, structure, readability)
3. Assess content alignment with job requirements
4. Provide specific, actionable recommendations
5. Focus on measurable improvements that will increase ATS score

Respond with ONLY valid JSON in this exact format:

{
  "overallScore": [number 0-100],
  "atsCompatibility": [number 0-100],
  "keywordMatch": [number 0-100],
  "formatting": [number 0-100],
  "sectionsOptimization": [number 0-100],
  "readability": [number 0-100],
  "insights": [
    {
      "type": "strength|improvement|warning",
      "title": "[insight title]",
      "description": "[detailed description]",
      "icon": "[emoji]"
    }
  ],
  "recommendations": [
    "[specific actionable recommendation]"
  ],
  "keywordAnalysis": {
    "matched": ["[matched keyword]"],
    "missing": ["[missing important keyword]"],
    "frequency": {
      "[keyword]": [count]
    }
  },
  "sectionsAnalysis": {
    "present": ["[section name]"],
    "missing": ["[recommended section]"],
    "scores": {
      "[section]": [score 0-100]
    }
  },
  "improvementAreas": [
    {
      "area": "[area name]",
      "priority": "high|medium|low",
      "suggestion": "[specific suggestion]"
    }
  ]
}

=== DETAILED ANALYSIS CRITERIA ===

**SCORING METHODOLOGY:**
- Overall Score (0-100): Weighted composite of all factors
- ATS Compatibility (0-100): Resume parsing friendliness, format structure
- Keyword Match (0-100): Percentage of critical job keywords found
- Formatting (0-100): Clean structure, proper sections, readability
- Sections Optimization (0-100): Completeness of essential resume sections
- Readability (0-100): Professional language, clear flow, grammar

**QUALITY BENCHMARKS:**
- 90-100: Exceptional - ATS-optimized, highly competitive
- 80-89: Strong - Minor tweaks needed, good ATS performance
- 70-79: Adequate - Several improvements needed for competitiveness
- 60-69: Weak - Major optimization required
- Below 60: Poor - Significant restructuring needed

**CRITICAL FOCUS AREAS:**
1. Exact keyword matching from job description (weight: 35%)
2. Missing essential skills and requirements (weight: 25%)
3. ATS parsing compatibility and format issues (weight: 20%)
4. Section completeness and professional structure (weight: 15%)
5. Quantified achievements and impact statements (weight: 5%)

**INSIGHT REQUIREMENTS:**
- Provide specific examples from the resume
- Suggest exact keyword insertions
- Identify formatting improvements
- Recommend section reorganization
- Quantify potential score improvements

Generate actionable, measurable recommendations with clear priority levels.`;

        // Enhanced Pollinations AI API call with retry mechanism
        let apiRes;
        let lastError;
        const maxRetries = 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), attempt === 1 ? 45000 : 60000);

                apiRes = await fetch("https://text.pollinations.ai/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json, text/plain, */*",
                        "User-Agent": "AI-Resume-ATS-Analyzer/1.0",
                        "X-Retry-Attempt": attempt.toString(),
                    },
                    body: JSON.stringify({
                        messages: [{
                            role: "system",
                            content: "You are an expert ATS analyst. Provide detailed, actionable resume analysis in the exact JSON format specified. Focus on practical improvements."
                        }, {
                            role: "user",
                            content: prompt
                        }],
                        model: "openai",
                        temperature: 0.3, // Lower temperature for more consistent output
                        max_tokens: 4000
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                
                if (apiRes.ok) {
                    break; // Success, exit retry loop
                }
                
                lastError = new Error(`API request failed with status ${apiRes.status} (attempt ${attempt})`);
                
                // Don't retry on client errors (4xx)
                if (apiRes.status >= 400 && apiRes.status < 500) {
                    break;
                }
                
            } catch (error) {
                lastError = error;
                console.error(`API request attempt ${attempt} failed:`, error.message);
                
                // Don't retry on abort errors unless it's the last attempt
                if (error.name === 'AbortError' && attempt < maxRetries) {
                    continue;
                }
            }
            
            // Wait before retry (exponential backoff)
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }

        // Handle final API response
        if (!apiRes || !apiRes.ok) {
            console.error('All API retry attempts failed:', lastError?.message);
            
            // Provide intelligent fallback analysis based on basic text analysis
            const fallbackAnalysis = generateFallbackAnalysis(sanitizedResume, sanitizedJobDesc);
            return NextResponse.json({
                ...fallbackAnalysis,
                fallback: true,
                message: "Analysis completed with enhanced fallback system due to temporary AI service unavailability."
            });
        }

        // Handle response
        let result;
        const contentType = apiRes.headers.get('content-type') || '';

        try {
            if (contentType.includes('application/json')) {
                const data = await apiRes.json();
                result = data.completion || data.output || data.text || data.response || data.message || JSON.stringify(data);
            } else {
                result = await apiRes.text();
            }
        } catch (parseError) {
            console.error('Error parsing API response:', parseError);
            result = await apiRes.text().catch(() => 'Error parsing response');
        }

        // Parse the JSON response from AI
        let analysisData;
        try {
            // Clean the result to extract JSON
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? jsonMatch[0] : result;
            analysisData = JSON.parse(jsonString);
        } catch (jsonError) {
            console.error('Error parsing analysis JSON:', jsonError);
            // Fallback analysis if JSON parsing fails
            analysisData = {
                overallScore: 75,
                atsCompatibility: 80,
                keywordMatch: 70,
                formatting: 85,
                sectionsOptimization: 75,
                readability: 80,
                insights: [
                    {
                        type: 'improvement',
                        title: 'Analysis Processing',
                        description: 'Analysis completed with fallback data. Please try again for detailed insights.',
                        icon: 'zap'
                    }
                ],
                recommendations: [
                    'Review keyword alignment with job description',
                    'Ensure all essential resume sections are present',
                    'Quantify achievements with specific metrics'
                ],
                keywordAnalysis: {
                    matched: ['General Skills'],
                    missing: ['Specific Requirements'],
                    frequency: { 'General': 1 }
                },
                sectionsAnalysis: {
                    present: ['Professional Summary', 'Experience', 'Skills'],
                    missing: ['Certifications'],
                    scores: { 'Overall': 75 }
                },
                improvementAreas: [
                    {
                        area: 'Keyword Optimization',
                        priority: 'high',
                        suggestion: 'Add more relevant keywords from job description'
                    }
                ]
            };
        }

        // Validate and ensure all required fields exist
        const validatedAnalysis = {
            overallScore: Math.min(100, Math.max(0, analysisData.overallScore || 75)),
            atsCompatibility: Math.min(100, Math.max(0, analysisData.atsCompatibility || 80)),
            keywordMatch: Math.min(100, Math.max(0, analysisData.keywordMatch || 70)),
            formatting: Math.min(100, Math.max(0, analysisData.formatting || 85)),
            sectionsOptimization: Math.min(100, Math.max(0, analysisData.sectionsOptimization || 75)),
            readability: Math.min(100, Math.max(0, analysisData.readability || 80)),
            insights: Array.isArray(analysisData.insights) ? analysisData.insights : [],
            recommendations: Array.isArray(analysisData.recommendations) ? analysisData.recommendations : [],
            keywordAnalysis: analysisData.keywordAnalysis || { matched: [], missing: [], frequency: {} },
            sectionsAnalysis: analysisData.sectionsAnalysis || { present: [], missing: [], scores: {} },
            improvementAreas: Array.isArray(analysisData.improvementAreas) ? analysisData.improvementAreas : []
        };

        return NextResponse.json(validatedAnalysis);

    } catch (error) {
        console.error('Error in ATS analysis:', error);

        let errorMessage = "Error generating ATS analysis. Please try again.";

        if (error.name === 'AbortError' || error.message.includes('timeout')) {
            errorMessage = "Analysis timed out. Please try again.";
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
            errorMessage = "Network error. Please check your connection and try again.";
        } else if (error.message.includes('API request failed')) {
            errorMessage = "AI service temporarily unavailable. Please try again.";
        }

        return NextResponse.json(
            {
                error: errorMessage,
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}

/**
 * Generate intelligent fallback analysis using basic text processing
 */
function generateFallbackAnalysis(resumeText, jobDescription) {
    const resumeLower = resumeText.toLowerCase();
    const jobLower = jobDescription.toLowerCase();
    
    // Extract keywords from job description
    const jobKeywords = extractKeywords(jobDescription);
    const resumeKeywords = extractKeywords(resumeText);
    
    // Calculate keyword match
    const matchedKeywords = jobKeywords.filter(keyword => 
        resumeLower.includes(keyword.toLowerCase())
    );
    const keywordMatch = jobKeywords.length > 0 ? 
        Math.round((matchedKeywords.length / jobKeywords.length) * 100) : 70;
    
    // Basic ATS compatibility check
    const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(resumeText);
    const hasPhone = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(resumeText);
    const hasStandardSections = [
        'experience', 'education', 'skills', 'summary', 'objective'
    ].some(section => resumeLower.includes(section));
    
    const atsCompatibility = Math.min(100, (
        (hasEmail ? 25 : 0) + 
        (hasPhone ? 25 : 0) + 
        (hasStandardSections ? 30 : 0) + 
        (resumeText.length > 200 ? 20 : 10)
    ));
    
    // Generate insights based on analysis
    const insights = [];
    
    if (keywordMatch >= 70) {
        insights.push({
            type: 'strength',
            title: 'Good Keyword Match',
            description: `Your resume contains ${matchedKeywords.length} relevant keywords from the job description.`,
            icon: '✅'
        });
    } else {
        insights.push({
            type: 'improvement',
            title: 'Keyword Optimization Needed',
            description: 'Consider adding more relevant keywords from the job description to improve ATS compatibility.',
            icon: '🔍'
        });
    }
    
    if (!hasEmail || !hasPhone) {
        insights.push({
            type: 'warning',
            title: 'Missing Contact Information',
            description: 'Ensure your resume includes both email and phone number for ATS parsing.',
            icon: '📞'
        });
    }
    
    const overallScore = Math.round(
        (keywordMatch * 0.4) + 
        (atsCompatibility * 0.3) + 
        (hasStandardSections ? 85 : 60) * 0.2 +
        (resumeText.length > 500 ? 80 : 60) * 0.1
    );
    
    return {
        overallScore,
        atsCompatibility,
        keywordMatch,
        formatting: hasStandardSections ? 85 : 65,
        sectionsOptimization: hasStandardSections ? 80 : 60,
        readability: resumeText.length > 300 ? 75 : 60,
        insights,
        recommendations: [
            'Review and incorporate relevant keywords from the job description',
            'Ensure all standard resume sections are clearly labeled',
            'Use action verbs and quantify achievements where possible',
            'Check that contact information is prominently displayed'
        ],
        keywordAnalysis: {
            matched: matchedKeywords.slice(0, 10),
            missing: jobKeywords.filter(kw => !matchedKeywords.includes(kw)).slice(0, 8),
            frequency: {}
        },
        sectionsAnalysis: {
            present: ['Contact Information', 'Professional Experience'],
            missing: hasStandardSections ? [] : ['Skills', 'Education'],
            scores: { 'Overall Structure': hasStandardSections ? 80 : 60 }
        }
    };
}

/**
 * Extract relevant keywords from text
 */
function extractKeywords(text) {
    const commonSkills = [
        'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'aws', 'docker',
        'project management', 'leadership', 'communication', 'teamwork', 'problem solving',
        'analytics', 'marketing', 'sales', 'customer service', 'data analysis',
        'microsoft office', 'excel', 'powerpoint', 'adobe', 'figma', 'git'
    ];
    
    const textLower = text.toLowerCase();
    return commonSkills.filter(skill => textLower.includes(skill));
}
