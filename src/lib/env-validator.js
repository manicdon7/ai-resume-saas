/**
 * Environment Configuration Validator
 * Validates required environment variables on startup
 */

const REQUIRED_ENV_VARS = {
  // Database
  MONGODB_URI: {
    required: true,
    description: 'MongoDB connection string',
    example: 'mongodb+srv://username:password@cluster.mongodb.net/database'
  },
  
  // Authentication
  JWT_SECRET: {
    required: true,
    description: 'JWT signing secret (minimum 32 characters)',
    example: 'your-super-secret-jwt-key-here-32-chars-min',
    validate: (value) => value.length >= 32
  },
  
  // Firebase
  NEXT_PUBLIC_FIREBASE_API_KEY: {
    required: true,
    description: 'Firebase API key',
    example: 'AIzaSyABC123...'
  },
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: {
    required: true,
    description: 'Firebase auth domain',
    example: 'your-project.firebaseapp.com'
  },
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: {
    required: true,
    description: 'Firebase project ID',
    example: 'your-project-id'
  },
  
  // Stripe (optional for development)
  STRIPE_SECRET_KEY: {
    required: process.env.NODE_ENV === 'production',
    description: 'Stripe secret key',
    example: 'sk_test_...'
  },
  STRIPE_PUBLISHABLE_KEY: {
    required: process.env.NODE_ENV === 'production',
    description: 'Stripe publishable key',
    example: 'pk_test_...'
  },
  
  // Optional
  NODE_ENV: {
    required: false,
    description: 'Node environment',
    example: 'development',
    default: 'development'
  },
  NEXT_PUBLIC_API_URL: {
    required: false,
    description: 'API base URL',
    example: 'http://localhost:3000',
    default: 'http://localhost:3000'
  }
};

class EnvValidationError extends Error {
  constructor(message, missingVars = [], invalidVars = []) {
    super(message);
    this.name = 'EnvValidationError';
    this.missingVars = missingVars;
    this.invalidVars = invalidVars;
  }
}

/**
 * Validate environment variables
 */
export function validateEnvironment() {
  const missing = [];
  const invalid = [];
  const warnings = [];

  for (const [key, config] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[key];
    
    // Check if required variable is missing
    if (config.required && (!value || value.trim() === '')) {
      missing.push({
        key,
        description: config.description,
        example: config.example
      });
      continue;
    }
    
    // Set default value if not provided
    if (!value && config.default) {
      process.env[key] = config.default;
      warnings.push(`Using default value for ${key}: ${config.default}`);
      continue;
    }
    
    // Skip validation if not provided and not required
    if (!value) continue;
    
    // Custom validation
    if (config.validate && !config.validate(value)) {
      invalid.push({
        key,
        value: value.substring(0, 20) + '...', // Truncate for security
        description: config.description,
        example: config.example
      });
    }
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('Environment warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  // Throw error if validation fails
  if (missing.length > 0 || invalid.length > 0) {
    let message = 'Environment validation failed:\n';
    
    if (missing.length > 0) {
      message += '\nMissing required variables:\n';
      missing.forEach(({ key, description, example }) => {
        message += `  - ${key}: ${description}\n    Example: ${example}\n`;
      });
    }
    
    if (invalid.length > 0) {
      message += '\nInvalid variables:\n';
      invalid.forEach(({ key, description, example }) => {
        message += `  - ${key}: ${description}\n    Example: ${example}\n`;
      });
    }
    
    message += '\nPlease check your .env.local file and ensure all required variables are set correctly.';
    
    throw new EnvValidationError(message, missing, invalid);
  }

  console.log('✅ Environment validation passed');
  return true;
}

/**
 * Get environment configuration summary
 */
export function getEnvironmentSummary() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    hasDatabase: !!process.env.MONGODB_URI,
    hasFirebase: !!(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    hasStripe: !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY),
    hasJwtSecret: !!process.env.JWT_SECRET,
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  };
}

/**
 * Check if running in development mode
 */
export function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * Get database configuration
 */
export function getDatabaseConfig() {
  return {
    uri: process.env.MONGODB_URI,
    name: 'roleFitAi' // Default database name
  };
}

/**
 * Get Firebase configuration
 */
export function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  };
}

/**
 * Get Stripe configuration
 */
export function getStripeConfig() {
  return {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  };
}

// Auto-validate on import in development
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  try {
    validateEnvironment();
  } catch (error) {
    if (error instanceof EnvValidationError) {
      console.error('\n❌ Environment Configuration Error:');
      console.error(error.message);
      
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    } else {
      console.error('Unexpected error during environment validation:', error);
    }
  }
}