import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import { ObjectId } from 'mongodb';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(request) {
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

    // If user doesn't have a Stripe customer ID, return no subscription
    if (!user.stripeCustomerId) {
      return NextResponse.json({
        hasSubscription: false,
        subscription: null,
        customerId: null,
      });
    }

    // Get all subscriptions for the customer
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      expand: ['data.default_payment_method', 'data.items.data.price.product'],
    });

    // Find the active subscription
    const activeSubscription = subscriptions.data.find(
      sub => sub.status === 'active' || sub.status === 'trialing'
    );

    if (!activeSubscription) {
      return NextResponse.json({
        hasSubscription: false,
        subscription: null,
        customerId: user.stripeCustomerId,
      });
    }

    // Get subscription details
    const subscriptionDetails = {
      id: activeSubscription.id,
      status: activeSubscription.status,
      current_period_start: activeSubscription.current_period_start,
      current_period_end: activeSubscription.current_period_end,
      cancel_at_period_end: activeSubscription.cancel_at_period_end,
      created: activeSubscription.created,
      plan: {
        id: activeSubscription.items.data[0].price.id,
        amount: activeSubscription.items.data[0].price.unit_amount,
        currency: activeSubscription.items.data[0].price.currency,
        interval: activeSubscription.items.data[0].price.recurring.interval,
        interval_count: activeSubscription.items.data[0].price.recurring.interval_count,
        product: activeSubscription.items.data[0].price.product.name,
      },
      payment_method: activeSubscription.default_payment_method,
    };

    return NextResponse.json({
      hasSubscription: true,
      subscription: subscriptionDetails,
      customerId: user.stripeCustomerId,
    });

  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to get subscription status',
      details: error.type || 'unknown_error'
    }, { status: 500 });
  }
}