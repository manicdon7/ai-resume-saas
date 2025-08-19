import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';
import Stripe from 'stripe';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Extract the user ID from the metadata
      const userId = session.metadata.userId;
      
      // Update user to Pro status
      const client = await clientPromise;
      const db = client.db('roleFitAi');
      const users = db.collection('users');
      
      await users.updateOne(
        { _id: new (await import('mongodb')).ObjectId(userId) },
        { $set: { isPro: true, proSince: new Date() } }
      );
      
      // Log the payment
      const payments = db.collection('payments');
      await payments.insertOne({
        userId: new (await import('mongodb')).ObjectId(userId),
        stripeSessionId: session.id,
        amount: session.amount_total,
        currency: session.currency,
        status: session.payment_status,
        createdAt: new Date()
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Disable body parsing for webhook
export const config = {
  api: {
    bodyParser: false,
  },
};