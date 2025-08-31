import { NextResponse } from 'next/server';
import { auth } from '../../../../lib/firebase-admin';
import { UserService } from '../../../../lib/user-service';

export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    // Delete resume data from MongoDB
    await UserService.deleteResumeData(decodedToken.uid);

    return NextResponse.json({
      success: true,
      message: 'Resume deleted successfully'
    });

  } catch (error) {
    console.error('Delete resume error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete resume',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    // Get resume data from MongoDB
    const resumeData = await UserService.getResumeData(decodedToken.uid);

    if (!resumeData) {
      return NextResponse.json({ 
        hasResume: false,
        message: 'No resume found'
      });
    }

    return NextResponse.json({
      hasResume: true,
      resumeText: resumeData.resumeText,
      parsedData: resumeData.parsedData,
      uploadedAt: resumeData.createdAt,
      lastModified: resumeData.updatedAt
    });

  } catch (error) {
    console.error('Get resume error:', error);
    return NextResponse.json({ 
      error: 'Failed to get resume',
      details: error.message 
    }, { status: 500 });
  }
}