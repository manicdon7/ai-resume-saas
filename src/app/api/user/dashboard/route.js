import { NextResponse } from 'next/server';
import { auth } from '../../../../lib/firebase-admin';
import { UserService } from '../../../../lib/user-service';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    // Get comprehensive user dashboard data
    const dashboardData = await UserService.getUserDashboardStats(decodedToken.uid);

    // Get resume data
    const resumeData = await UserService.getResumeData(decodedToken.uid);

    return NextResponse.json({
      success: true,
      user: dashboardData.user,
      stats: dashboardData.stats,
      recentActivity: dashboardData.recentActivity,
      resume: resumeData ? {
        hasResume: true,
        resumeText: resumeData.resumeText,
        parsedData: resumeData.parsedData,
        fileName: resumeData.fileName,
        uploadedAt: resumeData.createdAt,
        lastModified: resumeData.updatedAt
      } : {
        hasResume: false
      }
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard data',
      details: error.message 
    }, { status: 500 });
  }
}