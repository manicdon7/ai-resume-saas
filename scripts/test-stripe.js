/**
 * Test script for Stripe integration
 * 
 * This script can be used to test Stripe API connectivity and basic functionality
 * without needing to go through the full application flow.
 * 
 * Usage: 
 * 1. Make sure your .env.local file is properly configured with Stripe keys
 * 2. Run with: node -r dotenv/config scripts/test-stripe.js
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Import Stripe
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Test function to verify Stripe connectivity
async function testStripeConnection() {
  try {
    console.log('Testing Stripe connection...');
    
    // Verify API key is working by fetching account details
    const account = await stripe.account.retrieve();
    console.log('✅ Successfully connected to Stripe');
    console.log(`Account: ${account.business_profile?.name || account.email}`);
    
    // List available products
    console.log('\nFetching products...');
    const products = await stripe.products.list({ limit: 5 });
    
    if (products.data.length > 0) {
      console.log('✅ Found existing products:');
      products.data.forEach(product => {
        console.log(`- ${product.name} (${product.id})`);
      });
    } else {
      console.log('ℹ️ No products found. Creating a test product...');
      
      // Create a test product and price
      const product = await stripe.products.create({
        name: 'RoleFitAI Pro (Test)',
        description: 'Test subscription for RoleFitAI Pro',
      });
      
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: 999,
        currency: 'usd',
        recurring: { interval: 'month' },
      });
      
      console.log('✅ Created test product and price:');
      console.log(`- Product: ${product.name} (${product.id})`);
      console.log(`- Price: $9.99/month (${price.id})`);
    }
    
    // Test creating a checkout session
    console.log('\nTesting checkout session creation...');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'RoleFitAI Pro (Test)',
              description: 'Test subscription for RoleFitAI Pro',
            },
            unit_amount: 999,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment-cancel`,
    });
    
    console.log('✅ Successfully created checkout session');
    console.log(`- Session ID: ${session.id}`);
    console.log(`- Checkout URL: ${session.url}`);
    
    console.log('\n✅ All Stripe tests passed successfully!');
  } catch (error) {
    console.error('❌ Stripe test failed:');
    console.error(error);
  }
}

// Run the test
testStripeConnection();