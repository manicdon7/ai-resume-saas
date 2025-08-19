import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    // Authenticate user
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
    
    // Get request data
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Verify the payment was successful
    if (session.payment_status === 'paid') {
      // Update user to Pro status if not already
      const client = await clientPromise;
      const db = client.db('roleFitAi');
      const users = db.collection('users');
      
      const user = await users.findOne({ _id: typeof userId === 'string' ? new (await import('mongodb')).ObjectId(userId) : userId });
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      // Only update if not already Pro
      if (!user.isPro) {
        await users.updateOne(
          { _id: user._id },
          { $set: { isPro: true, proSince: new Date() } }
        );
      }
      
      return NextResponse.json({ 
        success: true, 
        isPro: true,
        message: 'Payment verified and Pro status updated'
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Payment not completed',
        status: session.payment_status
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}