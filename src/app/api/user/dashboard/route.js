import { NextResponse } from 'next/server';
import { auth } from '../../../../lib/firebase-admin';
import { UserService } from '@/lib/user-service';
import { withErrorHandler, APIError, ERROR_CODES } from '@/lib/api-error-handler';
import { protectedMiddleware } from '@/lib/api-middleware';

async function dashboardHandler(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new APIError('Missing or invalid authorization header', 401, ERROR_CODES.UNAUTHORIZED);
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
    stats: {
      resumesCreated: dashboardData.stats.resumesCreated || 0,
      applicationsSubmitted: dashboardData.stats.applicationsSent || 0,
      credits: dashboardData.user.credits || 0,
      isPro: dashboardData.user.isPro || false
    },
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
    },
    timestamp: new Date().toISOString()
  });
}

export const GET = protectedMiddleware(withErrorHandler(dashboardHandler));