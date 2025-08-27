import { NextResponse } from 'next/server';
import { sendEmail, sendVerificationEmail } from '../../../../lib/email-service';
import { auth } from '../../../lib/firebase-admin';

export async function POST(request) {
  try {
    const { type, email, templateData, authToken } = await request.json();

    // Verify authentication for protected email types
    if (authToken && type !== 'verification') {
      try {
        const decodedToken = await auth.verifyIdToken(authToken);
        templateData.userId = decodedToken.uid;
      } catch (error) {
        return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
      }
    }

    let result;

    switch (type) {
      case 'welcome':
        result = await sendEmail(email, 'welcome', templateData);
        break;
      
      case 'resumeEnhanced':
        result = await sendEmail(email, 'resumeEnhanced', templateData);
        break;
      
      case 'jobMatch':
        result = await sendEmail(email, 'jobMatch', templateData);
        break;
      
      case 'weeklyDigest':
        result = await sendEmail(email, 'weeklyDigest', templateData);
        break;
      
      case 'applicationReminder':
        result = await sendEmail(email, 'applicationReminder', templateData);
        break;
      
      case 'verification':
        result = await sendVerificationEmail(email, templateData.verificationToken, templateData.userName);
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        messageId: result.messageId,
        message: 'Email sent successfully'
      });
    } else {
      return NextResponse.json({ 
        error: 'Failed to send email', 
        details: result.error 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

// GET endpoint for email templates preview (development only)
export async function GET(request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const template = searchParams.get('template');
  
  if (!template) {
    return NextResponse.json({ 
      availableTemplates: ['welcome', 'resumeEnhanced', 'jobMatch', 'weeklyDigest', 'applicationReminder']
    });
  }

  // Return template preview for development
  const mockData = {
    userName: 'John Doe',
    jobTitle: 'Software Engineer',
    companyName: 'Tech Corp',
    jobsCount: 5,
    topJob: {
      title: 'Senior Frontend Developer',
      company: 'Innovation Labs',
      location: 'San Francisco, CA',
      matchScore: 95,
      description: 'Join our team building next-generation web applications...'
    },
    stats: {
      resumesEnhanced: 3,
      jobsApplied: 7,
      coverLetters: 5,
      profileViews: 24
    },
    daysAgo: 3
  };

  try {
    const { emailTemplates } = await import('../../../../lib/email-service');
    const emailContent = emailTemplates[template]('John Doe', ...Object.values(mockData).slice(1));
    
    return new Response(emailContent.html, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }
}
