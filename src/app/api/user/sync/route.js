import { NextResponse } from 'next/server';
import { auth } from '../../../../lib/firebase-admin';
import { UserService } from '../../../../lib/user-service';

// POST - Sync user data between Firebase and MongoDB
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    const { 
      acceptedTerms, 
      isNotificationOn, 
      emailPreferences,
      isNewUser = false 
    } = await request.json();

    // Validate user data for ethical compliance
    const userData = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name,
      acceptedTerms,
      isNotificationOn,
      emailPreferences
    };

    const validation = UserService.validateUserData(userData);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid user data', 
        details: validation.errors 
      }, { status: 400 });
    }

    // Create or update user in both MongoDB and Firebase
    const user = await UserService.createOrUpdateUser(
      {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name,
        photoURL: decodedToken.picture,
        emailVerified: decodedToken.email_verified
      },
      {
        acceptedTerms,
        isNotificationOn,
        emailPreferences
      }
    );

    // Send welcome email for new users if notifications enabled
    if (isNewUser && isNotificationOn && emailPreferences?.welcomeEmails) {
      try {
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'welcome',
            email: decodedToken.email,
            templateData: {
              userName: decodedToken.name || decodedToken.email.split('@')[0] || 'User',
              userEmail: decodedToken.email
            }
          })
        });
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the main request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        credits: user.credits,
        isPro: user.isPro,
        acceptedTerms: user.acceptedTerms,
        isNotificationOn: user.isNotificationOn,
        emailPreferences: user.emailPreferences
      }
    });

  } catch (error) {
    console.error('User sync error:', error);
    return NextResponse.json({ 
      error: 'Failed to sync user data',
      details: error.message 
    }, { status: 500 });
  }
}

// GET - Get user data from MongoDB
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    const user = await UserService.getUserById(decodedToken.uid);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        credits: user.credits,
        isPro: user.isPro,
        acceptedTerms: user.acceptedTerms,
        isNotificationOn: user.isNotificationOn,
        emailPreferences: user.emailPreferences,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ 
      error: 'Failed to get user data',
      details: error.message 
    }, { status: 500 });
  }
}
