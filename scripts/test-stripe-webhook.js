/**
 * Test script for Stripe webhooks
 * 
 * This script simulates a Stripe webhook event to test the webhook handler
 * without needing to make actual payments.
 * 
 * Usage: 
 * 1. Make sure your .env.local file is properly configured with Stripe keys
 * 2. Run with: node -r dotenv/config scripts/test-stripe-webhook.js
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Import required modules
const fetch = require('node-fetch');
const crypto = require('crypto');

// Configuration
const WEBHOOK_URL = 'http://localhost:3000/api/payment/webhook';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Sample checkout.session.completed event
const createSampleEvent = (userId) => ({
  id: `evt_${crypto.randomUUID().replace(/-/g, '')}`,
  object: 'event',
  api_version: '2023-10-16',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: `cs_test_${crypto.randomUUID().replace(/-/g, '')}`,
      object: 'checkout.session',
      after_expiration: null,
      allow_promotion_codes: null,
      amount_subtotal: 999,
      amount_total: 999,
      automatic_tax: { enabled: false, status: null },
      billing_address_collection: null,
      cancel_url: 'http://localhost:3000/payment-cancel',
      client_reference_id: null,
      consent: null,
      consent_collection: null,
      created: Math.floor(Date.now() / 1000),
      currency: 'usd',
      custom_fields: [],
      custom_text: { shipping_address: null, submit: null },
      customer: `cus_${crypto.randomUUID().replace(/-/g, '')}`,
      customer_creation: 'always',
      customer_details: {
        address: {
          city: null,
          country: 'US',
          line1: null,
          line2: null,
          postal_code: null,
          state: null
        },
        email: 'test@example.com',
        name: 'Test User',
        phone: null,
        tax_exempt: 'none',
        tax_ids: []
      },
      customer_email: 'test@example.com',
      expires_at: Math.floor(Date.now() / 1000) + 86400,
      livemode: false,
      locale: null,
      metadata: {
        userId: userId || 'test_user_id'
      },
      mode: 'subscription',
      payment_intent: null,
      payment_link: null,
      payment_method_collection: 'always',
      payment_method_options: {},
      payment_method_types: ['card'],
      payment_status: 'paid',
      phone_number_collection: { enabled: false },
      recovered_from: null,
      setup_intent: null,
      shipping_address_collection: null,
      shipping_cost: null,
      shipping_details: null,
      shipping_options: [],
      status: 'complete',
      submit_type: null,
      subscription: `sub_${crypto.randomUUID().replace(/-/g, '')}`,
      success_url: 'http://localhost:3000/payment-success?session_id={CHECKOUT_SESSION_ID}',
      total_details: { amount_discount: 0, amount_shipping: 0, amount_tax: 0 },
      url: null
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: { id: null, idempotency_key: null },
  type: 'checkout.session.completed'
});

// Function to sign the payload
const generateSignature = (payload, secret) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
};

// Function to send the webhook
async function sendWebhook(userId) {
  try {
    console.log('Preparing to send test webhook event...');
    
    // Create the event payload
    const event = createSampleEvent(userId);
    const payload = JSON.stringify(event);
    
    // Generate the signature
    const signature = generateSignature(payload, WEBHOOK_SECRET);
    
    console.log(`Sending webhook to: ${WEBHOOK_URL}`);
    console.log(`Event type: ${event.type}`);
    console.log(`User ID in metadata: ${event.data.object.metadata.userId}`);
    
    // Send the request
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': signature
      },
      body: payload
    });
    
    // Parse the response
    const responseText = await response.text();
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response body: ${responseText}`);
    
    if (response.ok) {
      console.log('✅ Webhook test successful!');
    } else {
      console.error('❌ Webhook test failed!');
    }
  } catch (error) {
    console.error('Error sending webhook:', error);
  }
}

// Get user ID from command line arguments or use default
const userId = process.argv[2] || 'test_user_id';

// Run the test
sendWebhook(userId);

console.log('\nNote: To use this script with a specific user ID, run:');
console.log('node -r dotenv/config scripts/test-stripe-webhook.js YOUR_USER_ID');