import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import { ObjectId } from 'mongodb';

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

    // Get user from database
    const client = await clientPromise;
    const db = client.db('roleFitAi');
    const users = db.collection('users');
    const user = await users.findOne({ _id: new ObjectId(userId) });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure Stripe customer exists
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      return NextResponse.json({ 
        error: 'No Stripe customer found. Please create a subscription first.' 
      }, { status: 400 });
    }

    // Get return URL from request body or use default
    const body = await request.json();
    const returnUrl = body.returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard`;

    // Create Stripe customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
      configuration: {
        features: {
          customer_update: {
            allowed_updates: ['email', 'address', 'shipping'],
            enabled: true,
          },
          invoice_history: {
            enabled: true,
          },
          payment_method_update: {
            enabled: true,
          },
          subscription_cancel: {
            enabled: true,
            cancellation_reason: {
              enabled: true,
              options: [
                'too_expensive',
                'missing_features',
                'switched_service',
                'unused',
                'customer_service',
                'too_complex',
                'other',
              ],
            },
          },
          subscription_update: {
            enabled: true,
            default_allowed_updates: ['price'],
            proration_behavior: 'create_prorations',
          },
        },
      },
    });

    // Log portal session creation
    console.log(`Created portal session for user ${userId}: ${portalSession.id}`);

    return NextResponse.json({
      url: portalSession.url,
      sessionId: portalSession.id,
    });

  } catch (error) {
    console.error('Stripe portal error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create customer portal',
      details: error.type || 'unknown_error'
    }, { status: 500 });
  }
}