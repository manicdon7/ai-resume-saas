import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import clientPromise from '../../../../../lib/mongodb';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const userId = decoded.uid;

    const { db } = await clientPromise();
    
    // Fetch user activity from database
    const activities = await db
      .collection('users')
      .find({ _id })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({
      activity: activities.map(activity => ({
        id: activity._id,
        type: activity.type,
        details: activity.details,
        timestamp: activity.timestamp,
        metadata: activity.metadata || {}
      }))
    });

  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const userId = decoded.uid;

    const body = await request.json();
    const { type, details, metadata = {} } = body;

    if (!type || !details) {
      return NextResponse.json(
        { error: 'Type and details are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToMongoDB();
    
    // Add activity record
    const activityRecord = {
      userId,
      type,
      details,
      metadata,
      timestamp: new Date().toISOString()
    };

    await db.collection('user_activity').insertOne(activityRecord);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error adding user activity:', error);
    return NextResponse.json(
      { error: 'Failed to add activity' },
      { status: 500 }
    );
  }
}
