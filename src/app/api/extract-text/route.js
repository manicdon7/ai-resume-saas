import { NextResponse } from 'next/server';
import { auth } from '../../../lib/firebase-admin';
import { UserService } from '../../../../lib/user-service';

// Enhanced resume parsing function
async function parseResumeText(text) {
    try {
        console.log('Parsing resume text, length:', text.length);
        
        if (!text || text.trim().length === 0) {
            console.log('No text to parse');
            return {
                name: '',
                email: '',
                phone: '',
                location: '',
                skills: [],
                summary: '',
                experience: [],
                education: [],
                certifications: []
            };
        }

        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        console.log('Processing', lines.length, 'lines');
        
        // Extract name (look for name patterns in first few lines)
        let name = '';
        for (let i = 0; i < Math.min(5, lines.length); i++) {
            const line = lines[i];
            // Skip lines that look like headers or contact info
            if (!line.toLowerCase().includes('resume') && 
                !line.toLowerCase().includes('curriculum') &&
                !line.includes('@') && 
                !line.match(/\d{3}/) && 
                line.length > 2 && 
                line.length < 50 &&
                /^[A-Za-z\s\-\.]+$/.test(line)) {
                name = line;
                break;
            }
        }
        
        // Extract email
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emailMatches = text.match(emailRegex);
        const email = emailMatches ? emailMatches[0] : '';
        
        // Extract phone (improved regex)
        const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
        const phoneMatches = text.match(phoneRegex);
        const phone = phoneMatches ? phoneMatches[0] : '';
        
        // Extract skills (enhanced keyword list)
        const skillKeywords = [
            'javascript', 'python', 'java', 'react', 'node.js', 'html', 'css', 'sql', 
            'mongodb', 'postgresql', 'git', 'docker', 'kubernetes', 'aws', 'azure',
            'typescript', 'angular', 'vue', 'express', 'django', 'flask', 'spring',
            'machine learning', 'data analysis', 'project management', 'agile', 'scrum',
            'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala',
            'redux', 'graphql', 'rest api', 'microservices', 'devops', 'ci/cd',
            'figma', 'sketch', 'photoshop', 'illustrator', 'ui/ux', 'design',
            'leadership', 'communication', 'problem solving', 'teamwork'
        ];
        
        const textLower = text.toLowerCase();
        const skills = skillKeywords.filter(skill => 
            textLower.includes(skill.toLowerCase())
        );
        
        // Extract location (improved patterns)
        const locationPatterns = [
            /([A-Za-z\s]+),\s*([A-Z]{2})\s*\d{5}/g, // City, State ZIP
            /([A-Za-z\s]+),\s*([A-Z]{2})/g, // City, State
            /([A-Za-z\s]+),\s*([A-Za-z\s]+)/g // City, Country
        ];
        
        let location = '';
        for (const pattern of locationPatterns) {
            const locationMatch = text.match(pattern);
            if (locationMatch) {
                location = locationMatch[0];
                break;
            }
        }
        
        // Try to extract summary (look for summary/objective sections)
        let summary = '';
        const summaryKeywords = ['summary', 'objective', 'profile', 'about'];
        for (const keyword of summaryKeywords) {
            const regex = new RegExp(`${keyword}[:\\s]*([^\\n]{50,200})`, 'i');
            const match = text.match(regex);
            if (match) {
                summary = match[1].trim();
                break;
            }
        }

        const result = {
            name: name || '',
            email: email || '',
            phone: phone || '',
            location: location || '',
            skills: skills || [],
            summary: summary || '',
            experience: [], // Could be enhanced with AI parsing
            education: [], // Could be enhanced with AI parsing
            certifications: []
        };

        console.log('Parsed result:', result);
        return result;
        
    } catch (error) {
        console.error('Error parsing resume:', error);
        return {
            name: '',
            email: '',
            phone: '',
            location: '',
            skills: [],
            summary: '',
            experience: [],
            education: [],
            certifications: []
        };
    }
}

export async function POST(request) {
    try {
        console.log('Extract-text API called');
        const formData = await request.formData();
        const file = formData.get('file');

        console.log('File received:', file ? file.name : 'No file');
        console.log('File type:', file ? file.type : 'No type');
        console.log('File size:', file ? file.size : 'No size');

        if (!file) {
            console.log('No file in request');
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = new Uint8Array(bytes);
        console.log('Buffer size:', buffer.length);

        let extractedText = '';

        // Handle different file types
        if (file.type === 'text/plain') {
            // Handle TXT files
            const decoder = new TextDecoder('utf-8');
            extractedText = decoder.decode(buffer);
        } else if (file.type === 'application/pdf') {
            // Handle PDF files with pdf-parse
            try {
                const pdfParse = await import('pdf-parse/lib/pdf-parse.js');
                const nodeBuffer = Buffer.from(buffer);
                const data = await pdfParse.default(nodeBuffer);
                extractedText = data.text;

                if (!extractedText || extractedText.trim().length === 0) {
                    return NextResponse.json({
                        error: "Could not extract text from PDF. The PDF might be image-based or encrypted.",
                        text: "",
                        suggestion: "Try copying the text manually: Open PDF → Select All (Ctrl+A/Cmd+A) → Copy → Paste below"
                    });
                }
            } catch (error) {
                console.error('PDF parsing error:', error);
                return NextResponse.json({
                    error: "Error processing PDF file. Please try copying the text manually.",
                    text: "",
                    suggestion: "Quick tip: Open your PDF → Select All (Ctrl+A/Cmd+A) → Copy (Ctrl+C/Cmd+C) → Paste below"
                });
            }
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // Handle DOCX files with mammoth
            try {
                const mammoth = await import('mammoth');
                const nodeBuffer = Buffer.from(buffer);
                const result = await mammoth.extractRawText({ buffer: nodeBuffer });
                extractedText = result.value;

                if (!extractedText) {
                    return NextResponse.json({
                        error: "Could not extract text from DOCX file.",
                        text: ""
                    });
                }
            } catch (error) {
                console.error('DOCX parsing error:', error);
                return NextResponse.json({
                    error: "Error processing DOCX file. Please try again or copy and paste the text.",
                    text: ""
                });
            }
        } else if (file.type === 'application/msword') {
            // DOC files are more complex, provide helpful message
            return NextResponse.json({
                error: "Legacy DOC files are not supported. Please save as DOCX, PDF, or TXT format.",
                text: ""
            });
        } else {
            return NextResponse.json(
                { error: "Unsupported file type. Please use PDF, DOCX, or TXT files." },
                { status: 400 }
            );
        }

        // Clean up the extracted text
        extractedText = extractedText
            .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
            .replace(/\n\s*\n/g, '\n')  // Replace multiple newlines with single newline
            .trim();

        if (!extractedText) {
            return NextResponse.json({
                error: "No text could be extracted from the file. Please try copying and pasting instead.",
                text: ""
            });
        }

        // Parse basic resume data
        const parsedData = await parseResumeText(extractedText);

        // Try to get user info and save resume data
        let userId = null;
        try {
            const authHeader = request.headers.get('authorization');
            if (authHeader?.startsWith('Bearer ')) {
                const token = authHeader.split('Bearer ')[1];
                const decodedToken = await auth.verifyIdToken(token);
                userId = decodedToken.uid;
                
                // Save resume data to MongoDB
                await UserService.saveResumeData(userId, {
                    resumeText: extractedText,
                    parsedData,
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size
                });
            }
        } catch (authError) {
            console.log('No valid auth token, proceeding without saving to database');
        }

        return NextResponse.json({
            text: extractedText,
            parsedData: parsedData,
            message: "Text extracted successfully!",
            saved: userId !== null
        });

    } catch (error) {
        console.error('Error extracting text:', error);
        return NextResponse.json(
            { error: "Error processing file. Please try again or copy and paste your text." },
            { status: 500 }
        );
    }
}