# Stripe Integration Documentation

## Overview

This document provides details on the Stripe payment integration for RoleFitAI's Pro subscription feature. The integration allows users to upgrade to a Pro account with a monthly subscription using Stripe's payment processing.

## Architecture

The Stripe integration consists of the following components:

1. **Frontend Components**:
   - Upgrade modal in the main application
   - Stripe checkout button component
   - Subscription plan card component
   - Payment status message component
   - Success and cancel pages

2. **Backend API Endpoints**:
   - `/api/payment/create-checkout` - Creates a Stripe checkout session
   - `/api/payment/webhook` - Handles Stripe webhook events
   - `/api/payment/verify` - Verifies payment status

3. **Utility Libraries**:
   - `lib/stripe.js` - Server-side Stripe instance
   - `lib/stripe-client.js` - Client-side Stripe utilities
   - `lib/stripe-utils.js` - Shared utility functions
   - `middleware/stripe-webhook-middleware.js` - Webhook verification

## Implementation Details

### Subscription Flow

1. User clicks "Upgrade to Pro" button in the application
2. Application creates a Stripe checkout session via API call
3. User is redirected to Stripe's hosted checkout page
4. After payment, user is redirected to success or cancel page
5. On successful payment, Stripe sends a webhook event
6. Backend processes the webhook and updates user's subscription status

### Stripe Product Configuration

The subscription is configured with the following details:

- **Product Name**: RoleFitAI Pro
- **Price**: $9.99 USD per month
- **Features**:
  - Unlimited resume enhancements
  - Priority processing
  - Advanced ATS optimization
  - Premium support

## API Endpoints

### Create Checkout Session

**Endpoint**: `POST /api/payment/create-checkout`

**Description**: Creates a Stripe checkout session for the Pro subscription.

**Authentication**: Requires JWT token in the request header.

**Response**: Returns the checkout session URL for redirection.

### Webhook Handler

**Endpoint**: `POST /api/payment/webhook`

**Description**: Handles Stripe webhook events, particularly `checkout.session.completed`.

**Authentication**: Verifies Stripe signature.

**Actions**: Updates user's subscription status in the database.

### Verify Payment

**Endpoint**: `POST /api/payment/verify`

**Description**: Verifies payment status using session ID.

**Authentication**: Requires JWT token in the request header.

**Response**: Returns payment status and updates user's subscription if needed.

## Testing

### Test Cards

Use these test cards for development:

- **Successful payment**: 4242 4242 4242 4242
- **Payment requires authentication**: 4000 0025 0000 3155
- **Payment declined**: 4000 0000 0000 9995

### Webhook Testing

Use the Stripe CLI for local webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/payment/webhook
```

## Deployment Considerations

1. **Environment Variables**: Ensure all Stripe-related environment variables are set in production.
2. **Webhook Configuration**: Update the webhook endpoint URL in the Stripe dashboard.
3. **SSL**: Ensure the application is served over HTTPS for secure payments.

## Troubleshooting

### Common Issues

1. **Webhook Verification Failures**:
   - Check that the webhook secret is correctly set in environment variables
   - Ensure the raw request body is being used for verification

2. **Payment Failures**:
   - Check browser console for client-side errors
   - Verify Stripe API keys are correct
   - Check server logs for detailed error messages

3. **Subscription Status Not Updating**:
   - Verify webhook events are being received
   - Check database connection and update operations
   - Ensure user identification is correct in the webhook handler

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)