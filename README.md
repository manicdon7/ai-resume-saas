# RoleFitAI - AI Resume Enhancement SaaS

This is a [Next.js](https://nextjs.org) project that provides AI-powered resume enhancement services with a premium subscription option via Stripe payment integration.

## Getting Started

### Prerequisites

- Node.js 18.x or later
- MongoDB database
- Firebase project for authentication
- Stripe account for payment processing

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# JWT Secret
JWT_SECRET=your_jwt_secret

# Stripe API keys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

**Note:** The Job Description field is now required for resume enhancement.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Stripe Integration

### Setting Up Stripe

1. Create a [Stripe account](https://stripe.com) if you don't have one
2. Get your API keys from the Stripe Dashboard
3. Add them to your `.env.local` file

### Testing Payments

For testing payments, use Stripe's test card numbers:
- Card number: `4242 4242 4242 4242`
- Expiration date: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

### Setting Up Webhooks

To handle payment events properly:

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Run webhook forwarding in development:
   ```bash
   stripe listen --forward-to localhost:3000/api/payment/webhook
   ```
3. Copy the webhook signing secret to your `.env.local` file

## Features

- AI-powered resume enhancement
- Firebase authentication
- Stripe payment integration
- MongoDB data storage
- JWT-based authentication
- Pro subscription management

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
