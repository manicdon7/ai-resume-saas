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

    // Sync resume state
    const resumeData = await ResumeService.syncResumeState(
      decodedToken.uid,
      null // No dispatch function in API route
    );

    return NextResponse.json({
      success: true,
      message: 'Resume state synchronized successfully',
      data: resumeData
    });

  } catch (error) {
    console.error('Resume sync API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to sync resume state',
        details: error.message 
      },
      { status: 500 }
    );
  }
}