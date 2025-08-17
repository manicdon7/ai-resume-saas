import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        // Add timeout for request parsing
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 30000)
        );

        const requestData = await Promise.race([
            request.json(),
            timeoutPromise
        ]);

        const { resumeText, jobDesc, resume, jobDescription } = requestData;

        // Normalize input fields for compatibility
        const normalizedResume = resumeText || resume || '';
        const normalizedJobDesc = jobDesc || jobDescription || '';

        // Validate and sanitize inputs
        if (!normalizedJobDesc || typeof normalizedJobDesc !== 'string' || !normalizedJobDesc.trim()) {
            // If resume is provided, generate a generic enhancement, else return warning
            if (normalizedResume && normalizedResume.trim()) {
                // Fallback: generate a generic resume enhancement
                // ... (copy the fallback logic from later in the file)
                // For now, just return a generic template
                return NextResponse.json(
                    { text: "\u26a0\ufe0f Job description is required for optimal resume tailoring. Please provide the job description to get the best results." },
                    { status: 200 }
                );
            } else {
                return NextResponse.json(
                    { text: "\u26a0\ufe0f Job description is required for optimal resume tailoring. Please provide the job description to get the best results." },
                    { status: 400 }
                );
            }
        }

        // Check input length limits
        if (normalizedJobDesc.length > 10000) {
            return NextResponse.json(
                { text: "⚠️ Job description is too long. Please limit to 10,000 characters." },
                { status: 400 }
            );
        }

        if (normalizedResume && normalizedResume.length > 15000) {
            return NextResponse.json(
                { text: "⚠️ Resume text is too long. Please limit to 15,000 characters." },
                { status: 400 }
            );
        }

        // Sanitize inputs (basic sanitization)
        const sanitizedJobDesc = normalizedJobDesc.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        const sanitizedResumeText = normalizedResume ? normalizedResume.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') : '';

        // Create a comprehensive prompt for resume enhancement
        const hasUserResume = sanitizedResumeText && sanitizedResumeText.trim().length > 50;

        const basePrompt = hasUserResume
            ? `You are a professional resume writer. Enhance this resume to perfectly match the target job requirements while maintaining authenticity.

CURRENT RESUME:
${sanitizedResumeText}

TARGET JOB REQUIREMENTS:
${sanitizedJobDesc}

ENHANCEMENT GOALS:
- Optimize for ATS systems with relevant keywords
- Quantify achievements with specific metrics
- Highlight transferable skills
- Improve professional language and impact statements
- Maintain truthfulness while maximizing appeal`
            : `You are a professional resume writer. Create a compelling resume template based on this job posting.

JOB REQUIREMENTS:
${sanitizedJobDesc}

CREATION GOALS:
- Match all key requirements and preferred qualifications
- Include industry-standard sections and formatting
- Use action verbs and quantifiable achievements
- Optimize for ATS scanning
- Create professional, modern layout`;

        const instructions = `

Create a professional resume with clean formatting. Structure exactly as follows:

# [Full Name]
**Email:** [professional email] | **Phone:** [phone number] | **LinkedIn:** [linkedin profile]

## Professional Summary
[Write 2-3 compelling sentences that highlight the most relevant experience and skills for this specific job. Include key technologies and years of experience.]

## Technical Skills
- **Programming Languages:** [List relevant languages from job posting]
- **Frameworks & Libraries:** [Match frameworks mentioned in job description]
- **Tools & Technologies:** [Include development tools, databases, cloud platforms]
- **Methodologies:** [Agile, DevOps, testing approaches if relevant]

## Professional Experience

### [Most Relevant Job Title]
**[Company Name]** | [City, State] | [Month Year] – [Month Year]
- [Quantified achievement using job keywords - include numbers, percentages, or scale]
- [Impact statement showing problem-solving with relevant technologies]
- [Leadership or collaboration example with measurable results]
- [Process improvement or efficiency gain with specific metrics]

### [Previous Relevant Position]
**[Previous Company]** | [City, State] | [Month Year] – [Month Year]
- [Achievement demonstrating growth in responsibility]
- [Technical accomplishment relevant to target role]
- [Cross-functional collaboration or client-facing success]

## Education
**[Degree Level]** in [Relevant Field]
[University Name] | [Graduation Year]
[Include relevant coursework, GPA if strong, or honors]

## Certifications & Additional Skills
- [Industry-relevant certifications]
- [Professional development courses]
- [Languages, if applicable]
- [Volunteer work or side projects if relevant]

---

# Cover Letter

[Create a personalized cover letter that will be replaced with a dynamic version during PDF generation. Keep this as a placeholder.]

Dear Hiring Manager,

I am writing to express my strong interest in the [position title] role. With my background in [relevant experience], I am excited about the opportunity to contribute to [company type/industry].

My experience includes [brief relevant highlights]. I am particularly drawn to this role because [specific reason related to job/company].

I would welcome the opportunity to discuss how my skills align with your team's needs.

Best regards,
[Full Name]

CRITICAL REQUIREMENTS:
- Use person's actual experience and achievements if provided
- Match job posting keywords naturally throughout
- Include specific metrics and quantifiable results
- Use professional, ATS-friendly formatting
- No generic templates - tailor everything to this specific job
- Maintain authenticity while optimizing for impact`;

        const prompt = basePrompt + instructions;

        // Call Pollinations AI API with improved error handling and timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        const apiRes = await fetch("https://text.pollinations.ai/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json, text/plain, */*",
                "User-Agent": "AI-Resume-Enhancer/1.0",
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

        // Handle both JSON and plain text responses with better error handling
        let result;
        const contentType = apiRes.headers.get('content-type') || '';

        try {
            if (contentType.includes('application/json')) {
                const data = await apiRes.json();
                result = data.completion || data.output || data.text || data.response || data.message || JSON.stringify(data);
            } else {
                // Handle plain text response
                result = await apiRes.text();
            }
        } catch (parseError) {
            console.error('Error parsing API response:', parseError);
            // Fallback to text parsing
            result = await apiRes.text().catch(() => 'Error parsing response');
        }

        if (!result || result.trim().length === 0) {
            result = "No output generated. Please try again with a different prompt.";
        }

        // Validate result length and content
        if (result.length < 50) {
            const fallbackTitle = hasUserResume ? "Enhanced Resume" : "Professional Resume Template";
            const fallbackContent = [
                `# ${fallbackTitle}`,
                "",
                "## Professional Summary",
                hasUserResume
                    ? "Enhanced professional summary based on your experience and the target job requirements."
                    : "Results-driven professional with expertise in the technologies and skills mentioned in the job description.",
                "",
                "## Technical Skills",
                "- **Programming Languages**: JavaScript, TypeScript, HTML5, CSS3",
                "- **Frameworks & Libraries**: React.js, Next.js, Tailwind CSS",
                "- **Tools & Technologies**: Git/GitHub, REST APIs, CI/CD pipelines",
                "- **Soft Skills**: Problem-solving, Team collaboration, Communication",
                "",
                "## Professional Experience",
                "",
                "### Frontend Developer",
                "**[Company Name]** | Remote | [Dates]",
                "- Developed responsive web applications using React.js and Next.js",
                "- Collaborated with cross-functional teams to deliver user-friendly interfaces",
                "- Implemented REST API integrations and optimized application performance",
                "- Participated in code reviews and maintained high code quality standards",
                "",
                "## Education",
                "**Bachelor's Degree** in Computer Science",
                "[University Name] | [Year]",
                "",
                "## Additional Skills",
                "- Experience with modern development workflows",
                "- Knowledge of responsive design principles",
                "- Familiarity with version control systems",
                "",
                "---",
                "",
                "# Cover Letter",
                "",
                "Dear Hiring Manager,",
                "",
                "I am excited to apply for the Frontend Developer position. My experience with React.js, Next.js, and modern web development practices makes me a strong candidate for this role.",
                "",
                hasUserResume
                    ? "Based on my background and the job requirements, I am confident I can contribute effectively to your team's success."
                    : "I am passionate about creating exceptional user experiences and would welcome the opportunity to contribute to your team.",
                "",
                "Thank you for your consideration. I look forward to discussing how my skills align with your needs.",
                "",
                "Best regards,",
                "[Your Name]"
            ];
            result = fallbackContent.join('\n');
        }

        return NextResponse.json({ text: result });

    } catch (error) {
        console.error('Error generating resume enhancement:', error);

        // Provide more specific error messages based on error type
        let errorMessage = "Error generating output. Please try again.";

        if (error.name === 'AbortError' || error.message.includes('timeout')) {
            errorMessage = "Request timed out. The AI service is taking too long to respond. Please try again.";
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
            errorMessage = "Network error. Please check your internet connection and try again.";
        } else if (error.message.includes('API request failed')) {
            errorMessage = "AI service temporarily unavailable. Please try again in a moment.";
        } else if (error.message.includes('JSON') || error.message.includes('parsing')) {
            errorMessage = "Response parsing error. Please try again.";
        } else if (error.message.includes('Request timeout')) {
            errorMessage = "Request processing timeout. Please try with shorter content.";
        }

        return NextResponse.json(
            {
                text: errorMessage,
                error: error.message,
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}