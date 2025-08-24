import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import jwt from 'jsonwebtoken';

export async function POST(request) {
    try {
        // --- Credit System Start ---
        const authHeader = request.headers.get('authorization');
        let userId = null;
        let isPro = false;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.userId;
            } catch (e) {
                return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
            }
        }
        if (!userId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        
        const client = await clientPromise;
        const db = client.db('roleFitAi');
        const users = db.collection('users');
        const user = await users.findOne({ _id: typeof userId === 'string' ? new (await import('mongodb')).ObjectId(userId) : userId });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }
        isPro = user.isPro || user.pro === true;
        
        // Daily credit logic
        const DAILY_CREDITS = 3;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let credits = user.credits ?? DAILY_CREDITS;
        let lastCreditReset = user.lastCreditReset ? new Date(user.lastCreditReset) : null;
        if (!lastCreditReset || lastCreditReset < today) {
            credits = DAILY_CREDITS;
            await users.updateOne(
                { _id: user._id },
                { $set: { credits, lastCreditReset: now } }
            );
        }
        if (!isPro) {
            if (credits <= 0) {
                return NextResponse.json(
                    { error: 'Daily limit reached. Upgrade to Pro for unlimited access.', credits: 0, isPro: false },
                    { status: 429 }
                );
            }
            // Decrement credit
            await users.updateOne(
                { _id: user._id },
                { $inc: { credits: -1 } }
            );
        }
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

        // Create comprehensive ATS analysis prompt
        const prompt = `You are an expert ATS (Applicant Tracking System) analyst. Analyze this resume against the job description and provide a comprehensive ATS optimization report.

RESUME CONTENT:
${sanitizedResume}

JOB DESCRIPTION:
${sanitizedJobDesc}

Provide your analysis in the following JSON format (respond ONLY with valid JSON, no additional text):

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

ANALYSIS CRITERIA:
1. **Overall Score**: Comprehensive ATS compatibility (0-100)
2. **ATS Compatibility**: How well the resume format works with ATS systems
3. **Keyword Match**: Percentage of job requirements keywords found in resume
4. **Formatting**: Clean, readable, ATS-friendly structure
5. **Sections Optimization**: Presence and quality of essential resume sections
6. **Readability**: Clear, professional language and flow

SCORING GUIDELINES:
- 90-100: Excellent - Ready for ATS submission
- 80-89: Good - Minor improvements needed
- 70-79: Fair - Several improvements required
- 60-69: Poor - Major improvements needed
- Below 60: Needs significant work

Focus on:
- Exact keyword matches from job description
- Missing critical skills/requirements
- ATS-friendly formatting issues
- Section completeness and relevance
- Quantifiable achievements alignment
- Industry-specific terminology usage

Be specific and actionable in recommendations.`;

        // Call Pollinations AI API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const apiRes = await fetch("https://text.pollinations.ai/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json, text/plain, */*",
                "User-Agent": "AI-Resume-ATS-Analyzer/1.0",
            },
            body: JSON.stringify({
                messages: [{
                    role: "user",
                    content: prompt
                }],
                model: "openai"
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!apiRes.ok) {
            const errorText = await apiRes.text().catch(() => 'Unknown error');
            console.error(`API request failed with status ${apiRes.status}:`, errorText);
            throw new Error(`API request failed with status ${apiRes.status}: ${errorText}`);
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
