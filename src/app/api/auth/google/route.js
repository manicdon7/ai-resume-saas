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

    // Check if user exists
    let user = await users.findOne({ email });

    if (!user) {
      // Create new user
      const result = await users.insertOne({
        googleId: uid,
        name,
        email,
        photoURL,
        isPro: false,
        authProvider: 'google',
        createdAt: new Date(),
        lastLogin: new Date()
      });
      
      user = {
        _id: result.insertedId,
        name,
        email,
        isPro: false,
        photoURL
      };
    } else {
      // Update existing user
      await users.updateOne(
        { _id: user._id },
        { 
          $set: { 
            lastLogin: new Date(),
            googleId: uid,
            photoURL: photoURL || user.photoURL
          } 
        }
      );
    }

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