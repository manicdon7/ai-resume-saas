import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { uid, email, name, photoURL } = await request.json();

    if (!uid || !email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields from Google auth' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('roleFitAi');
    const users = db.collection('users');

    // Always upsert user in MongoDB for Google sign-in
    const now = new Date();
    const update = {
      $set: {
        googleId: uid,
        name,
        email,
        photoURL,
        authProvider: 'google',
        lastLogin: now
      },
      $setOnInsert: {
        isPro: false,
        credits: 3,
        lastCreditReset: now,
        createdAt: now
      }
    };
    await users.updateOne(
      { email },
      update,
      { upsert: true }
    );
    // Fetch the latest user document (created if not exist)
    const user = await users.findOne({ email });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, isPro: user.isPro },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isPro: user.isPro,
        credits: user.credits ?? 3,
        photoURL: user.photoURL
      }
    });

  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}