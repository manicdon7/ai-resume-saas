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
    const { resumeData } = body;

    if (!resumeData) {
      return NextResponse.json(
        { error: 'Resume data is required' },
        { status: 400 }
      );
    }

    // Save resume using ResumeService
    const savedResume = await ResumeService.saveResume(
      decodedToken.uid, 
      resumeData,
      null // No dispatch function in API route
    );

    return NextResponse.json({
      success: true,
      message: 'Resume saved successfully',
      data: {
        resumeId: savedResume._id,
        version: savedResume.version,
        updatedAt: savedResume.updatedAt,
        metadata: savedResume.metadata
      }
    });

  } catch (error) {
    console.error('Resume save API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to save resume',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
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

    // Get resume data
    const resumeData = await ResumeService.getResumeData(decodedToken.uid);

    if (!resumeData) {
      return NextResponse.json({
        success: true,
        message: 'No resume found',
        data: null
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Resume retrieved successfully',
      data: resumeData
    });

  } catch (error) {
    console.error('Resume get API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve resume',
        details: error.message 
      },
      { status: 500 }
    );
  }
}