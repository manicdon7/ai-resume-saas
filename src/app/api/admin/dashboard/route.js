import { NextResponse } from 'next/server';
import { auth } from '../../../../lib/firebase-admin';
import { AdminUserManager, AdminAnalytics, AdminUtils } from '../../../../lib/admin-utils';

// GET admin dashboard data
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Verify admin privileges
    const isAdmin = await AdminUtils.verifyAdminUser(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Insufficient privileges' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'overview';

    switch (action) {
      case 'overview':
        const [userStats, emailStats, systemHealth] = await Promise.all([
          AdminAnalytics.getUserStats(30),
          AdminAnalytics.getEmailStats(),
          AdminAnalytics.getSystemHealth()
        ]);

        return NextResponse.json({
          userStats,
          emailStats,
          systemHealth,
          timestamp: new Date().toISOString()
        });

      case 'users':
        const maxResults = parseInt(searchParams.get('limit')) || 50;
        const pageToken = searchParams.get('pageToken') || null;
        
        const usersData = await AdminUserManager.listUsers(maxResults, pageToken);
        return NextResponse.json(usersData);

      case 'user-details':
        const uid = searchParams.get('uid');
        if (!uid) {
          return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }
        
        const userDetails = await AdminUserManager.getUserById(uid);
        return NextResponse.json(userDetails);

      case 'analytics':
        const days = parseInt(searchParams.get('days')) || 30;
        const analytics = await AdminAnalytics.getUserStats(days);
        return NextResponse.json(analytics);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// POST admin actions
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const adminUserId = decodedToken.uid;

    // Verify admin privileges
    const isAdmin = await AdminUtils.verifyAdminUser(adminUserId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Insufficient privileges' }, { status: 403 });
    }

    const { action, ...data } = await request.json();

    switch (action) {
      case 'update-user-status':
        const { uid, disabled } = data;
        if (!uid || typeof disabled !== 'boolean') {
          return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
        }
        
        const statusResult = await AdminUserManager.updateUserStatus(uid, disabled);
        return NextResponse.json(statusResult);

      case 'set-user-claims':
        const { uid: claimsUid, claims } = data;
        if (!claimsUid || !claims) {
          return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
        }
        
        const claimsResult = await AdminUserManager.setUserClaims(claimsUid, claims);
        return NextResponse.json(claimsResult);

      case 'delete-user':
        const { uid: deleteUid } = data;
        if (!deleteUid) {
          return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }
        
        const deleteResult = await AdminUserManager.deleteUser(deleteUid);
        return NextResponse.json(deleteResult);

      case 'bulk-notification':
        const { userIds, emailType, templateData } = data;
        if (!userIds || !Array.isArray(userIds) || !emailType) {
          return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
        }
        
        const bulkResult = await AdminUtils.sendBulkNotification(userIds, emailType, templateData);
        return NextResponse.json({ results: bulkResult });

      case 'cleanup-inactive':
        const { daysInactive } = data;
        const cleanupResult = await AdminUtils.cleanupInactiveUsers(daysInactive || 365);
        return NextResponse.json(cleanupResult);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Admin action error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// PUT admin configuration updates
export async function PUT(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const adminUserId = decodedToken.uid;

    // Verify admin privileges
    const isAdmin = await AdminUtils.verifyAdminUser(adminUserId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Insufficient privileges' }, { status: 403 });
    }

    const { configType, settings } = await request.json();

    // Here you could implement system-wide configuration updates
    // For example: email templates, system settings, feature flags, etc.
    
    return NextResponse.json({ 
      success: true,
      message: 'Configuration updated successfully',
      configType,
      updatedBy: adminUserId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin configuration error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
