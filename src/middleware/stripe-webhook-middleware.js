import { NextResponse } from 'next/server';
import Stripe from 'stripe';

/**
 * Middleware to verify Stripe webhook signatures
 * 
 * @param {Request} request - The incoming request
 * @returns {Promise<Response>} - The response or next middleware
 */
export async function verifyStripeWebhook(request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const signature = request.headers.get('stripe-signature');
  
  if (!signature) {
    return new NextResponse(JSON.stringify({ error: 'Missing stripe-signature header' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get the raw body as text
    const rawBody = await request.text();
    
    // Verify the signature
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    // Return the verified event
    return { isValid: true, event, rawBody };
  } catch (error) {
    console.error('Stripe webhook verification failed:', error.message);
    
    return { 
      isValid: false, 
      error: error.message,
      response: new NextResponse(JSON.stringify({ error: `Webhook Error: ${error.message}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    };
  }
}