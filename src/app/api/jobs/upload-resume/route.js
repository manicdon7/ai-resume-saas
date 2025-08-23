import { NextResponse } from 'next/server';
import { verifyIdToken } from '../../../../../src/lib/firebase-admin';
import { uploadResume } from '../../../../../src/lib/resume-parser';

export async function POST(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('resume');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Process resume
    const resumeData = await uploadResume(file, decodedToken.uid);

    return NextResponse.json({
      success: true,
      filename: file.name,
      extractedSkills: resumeData.skills || [],
      extractedExperience: resumeData.experience || [],
      extractedEducation: resumeData.education || []
    });

  } catch (error) {
    console.error('Resume upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process resume' }, 
      { status: 500 }
    );
  }
}