import { NextResponse } from 'next/server';
import { verifyIdToken } from '../../../../../src/lib/firebase-admin';
import { ResumeService } from '../../../../../src/lib/resume-service';

export async function POST(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Verify Firebase token
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);
    
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { resumeText } = body;

    if (!resumeText || typeof resumeText !== 'string') {
      return NextResponse.json(
        { error: 'Resume text is required and must be a string' },
        { status: 400 }
      );
    }

    // Parse resume text
    const parsedData = await ResumeService.parseResumeText(resumeText);

    return NextResponse.json({
      success: true,
      message: 'Resume parsed successfully',
      data: parsedData
    });

  } catch (error) {
    console.error('Resume parse API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to parse resume',
        details: error.message 
      },
      { status: 500 }
    );
  }
}