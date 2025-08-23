import { NextResponse } from 'next/server';
import { verifyIdToken } from '../../../../../src/lib/firebase-admin';
import { saveApplication } from '../../../../../src/lib/job-applications';

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
    
    const applicationData = {
      userId: decodedToken.uid,
      jobId: formData.get('jobId'),
      jobTitle: formData.get('jobTitle'),
      company: formData.get('company'),
      coverLetter: formData.get('coverLetter'),
      linkedinUrl: formData.get('linkedinUrl'),
      portfolioUrl: formData.get('portfolioUrl'),
      additionalNotes: formData.get('additionalNotes'),
      appliedAt: new Date().toISOString()
    };

    // Validate required fields
    if (!applicationData.jobId || !applicationData.jobTitle || !applicationData.company) {
      return NextResponse.json(
        { error: 'Missing required job information' }, 
        { status: 400 }
      );
    }

    // Handle resume file if provided
    const resumeFile = formData.get('resume');
    if (resumeFile) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (resumeFile.size > maxSize) {
        return NextResponse.json({ error: 'Resume file too large' }, { status: 400 });
      }

      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(resumeFile.type)) {
        return NextResponse.json({ error: 'Invalid resume file type' }, { status: 400 });
      }

      // Store resume (in production, upload to cloud storage)
      applicationData.resumeFileName = resumeFile.name;
      applicationData.resumeFileType = resumeFile.type;
    }

    // Validate URLs
    if (applicationData.linkedinUrl && !isValidUrl(applicationData.linkedinUrl)) {
      return NextResponse.json({ error: 'Invalid LinkedIn URL' }, { status: 400 });
    }

    if (applicationData.portfolioUrl && !isValidUrl(applicationData.portfolioUrl)) {
      return NextResponse.json({ error: 'Invalid portfolio URL' }, { status: 400 });
    }

    // Save application
    const applicationId = await saveApplication(applicationData);

    return NextResponse.json({
      success: true,
      applicationId,
      message: 'Application submitted successfully'
    });

  } catch (error) {
    console.error('Job application error:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' }, 
      { status: 500 }
    );
  }
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}