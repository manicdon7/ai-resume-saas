import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const client = await clientPromise;
    const db = client.db('roleFitAi');
    const users = db.collection('users');
    const user = await users.findOne({ _id: typeof userId === 'string' ? new (await import('mongodb')).ObjectId(userId) : userId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({
      credits: user.credits ?? 3,
      isPro: user.isPro ?? false
    });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
