import { NextResponse } from 'next/server';
import { auth, db } from '../../../../lib/firebase-admin';

// GET user preferences
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get user preferences from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      // Create default preferences for new user
      const defaultPreferences = {
        isNotificationOn: true,
        acceptedTerms: false,
        emailPreferences: {
          welcomeEmails: true,
          resumeUpdates: true,
          jobMatches: true,
          weeklyDigest: true,
          applicationReminders: true,
          marketingEmails: false
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.collection('users').doc(userId).set({
        email: decodedToken.email,
        name: decodedToken.name || '',
        ...defaultPreferences
      });

      return NextResponse.json(defaultPreferences);
    }

    const userData = userDoc.data();
    return NextResponse.json({
      isNotificationOn: userData.isNotificationOn ?? true,
      acceptedTerms: userData.acceptedTerms ?? false,
      emailPreferences: userData.emailPreferences ?? {
        welcomeEmails: true,
        resumeUpdates: true,
        jobMatches: true,
        weeklyDigest: true,
        applicationReminders: true,
        marketingEmails: false
      }
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json({ 
      error: 'Failed to get user preferences',
      details: error.message 
    }, { status: 500 });
  }
}

// POST/PUT update user preferences
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { isNotificationOn, acceptedTerms, emailPreferences } = await request.json();

    // Update user preferences in Firestore
    const updateData = {
      updatedAt: new Date().toISOString()
    };

    if (typeof isNotificationOn === 'boolean') {
      updateData.isNotificationOn = isNotificationOn;
    }

    if (typeof acceptedTerms === 'boolean') {
      updateData.acceptedTerms = acceptedTerms;
      updateData.termsAcceptedAt = new Date().toISOString();
    }

    if (emailPreferences && typeof emailPreferences === 'object') {
      updateData.emailPreferences = emailPreferences;
    }

    await db.collection('users').doc(userId).update(updateData);

    return NextResponse.json({ 
      success: true, 
      message: 'Preferences updated successfully',
      updatedFields: Object.keys(updateData)
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json({ 
      error: 'Failed to update user preferences',
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE user preferences (reset to defaults)
export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Reset to default preferences
    const defaultPreferences = {
      isNotificationOn: true,
      acceptedTerms: false,
      emailPreferences: {
        welcomeEmails: true,
        resumeUpdates: true,
        jobMatches: true,
        weeklyDigest: true,
        applicationReminders: true,
        marketingEmails: false
      },
      updatedAt: new Date().toISOString()
    };

    await db.collection('users').doc(userId).update(defaultPreferences);

    return NextResponse.json({ 
      success: true, 
      message: 'Preferences reset to defaults',
      preferences: defaultPreferences
    });

  } catch (error) {
    console.error('Reset preferences error:', error);
    return NextResponse.json({ 
      error: 'Failed to reset user preferences',
      details: error.message 
    }, { status: 500 });
  }
}
