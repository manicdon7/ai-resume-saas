import { NextResponse } from 'next/server';
import { checkRateLimit, APIError, ERROR_CODES, createErrorResponse } from './api-error-handler';
import { CreditsService } from './credits-service';

/**
 * API Middleware System
 * Provides reusable middleware for API routes
 */

/**
 * CORS Middleware
 */
export function corsMiddleware(allowedOrigins = ['http://localhost:3000','https://rolefitai.vercel.app']) {
  return (handler) => async (request, context) => {
    const origin = request.headers.get('origin');
    const isAllowed = allowedOrigins.includes('*') || allowedOrigins.includes(origin);

    const response = await handler(request, context);

    if (isAllowed) {
      response.headers.set('Access-Control-Allow-Origin', origin || '*');
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');

    return response;
  };
}

/**
 * Rate Limiting Middleware
 */
export function rateLimitMiddleware(maxRequests = 100, windowMs = 15 * 60 * 1000) {
  return (handler) => async (request, context) => {
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    try {
      checkRateLimit(`${request.url}:${clientIp}`, maxRequests, windowMs);
      return await handler(request, context);
    } catch (error) {
      if (error instanceof APIError && error.code === ERROR_CODES.RATE_LIMIT_EXCEEDED) {
        return NextResponse.json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            retryAfter: error.details?.retryAfter
          }
        }, { 
          status: 429,
          headers: {
            'Retry-After': error.details?.retryAfter?.toString() || '60'
          }
        });
      }
      throw error;
    }
  };
}

/**
 * Authentication Middleware
 */
export function authMiddleware(required = true) {
  return (handler) => async (request, context) => {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader && required) {
      return NextResponse.json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required'
        }
      }, { status: 401 });
    }

    if (authHeader) {
      try {
        const { user } = await CreditsService.authenticateUser(authHeader);
        // Add user to request context
        request.user = user;
      } catch (error) {
        if (required) {
          return createErrorResponse(error, request);
        }
        // If auth is optional, continue without user
        request.user = null;
      }
    }

    return await handler(request, context);
  };
}

/**
 * Credit Protection Middleware
 */
export function creditMiddleware(action, requiredCredits = 1) {
  return (handler) => async (request, context) => {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required for credit-protected actions'
        }
      }, { status: 401 });
    }

    try {
      // Validate credits before proceeding
      const validation = await CreditsService.validateCreditsForAction(
        authHeader, 
        action, 
        requiredCredits
      );

      if (!validation.success) {
        return NextResponse.json({
          success: false,
          error: {
            code: ERROR_CODES.INSUFFICIENT_CREDITS,
            message: validation.error,
            credits: validation.credits,
            isPro: validation.isPro,
            requiredCredits
          }
        }, { status: validation.statusCode });
      }

      // Add credit info to request
      request.creditInfo = {
        credits: validation.credits,
        isPro: validation.isPro,
        action,
        requiredCredits
      };

      const response = await handler(request, context);

      // If handler was successful and user is not pro, consume credits
      if (response.status < 400 && !validation.isPro) {
        try {
          await CreditsService.consumeCreditsAtomic(authHeader, action, requiredCredits);
        } catch (consumeError) {
          console.error('Failed to consume credits after successful operation:', consumeError);
          // Log but don't fail the request since the operation was successful
        }
      }

      return response;
    } catch (error) {
      return createErrorResponse(error, request);
    }
  };
}

/**
 * Validation Middleware
 */
export function validationMiddleware(schema) {
  return (handler) => async (request, context) => {
    try {
      const body = await request.json();
      
      // Simple validation - in production, use a library like Joi or Zod
      for (const [field, rules] of Object.entries(schema)) {
        const value = body[field];
        
        if (rules.required && (value === undefined || value === null || value === '')) {
          throw new APIError(
            `Field '${field}' is required`,
            400,
            ERROR_CODES.MISSING_REQUIRED_FIELD,
            { field }
          );
        }
        
        if (value !== undefined && rules.type && typeof value !== rules.type) {
          throw new APIError(
            `Field '${field}' must be of type ${rules.type}`,
            400,
            ERROR_CODES.INVALID_INPUT,
            { field, expectedType: rules.type, actualType: typeof value }
          );
        }
        
        if (value !== undefined && rules.minLength && value.length < rules.minLength) {
          throw new APIError(
            `Field '${field}' must be at least ${rules.minLength} characters`,
            400,
            ERROR_CODES.INVALID_INPUT,
            { field, minLength: rules.minLength, actualLength: value.length }
          );
        }
        
        if (value !== undefined && rules.maxLength && value.length > rules.maxLength) {
          throw new APIError(
            `Field '${field}' must be no more than ${rules.maxLength} characters`,
            400,
            ERROR_CODES.INVALID_INPUT,
            { field, maxLength: rules.maxLength, actualLength: value.length }
          );
        }
      }
      
      // Add validated body to request
      request.validatedBody = body;
      
      return await handler(request, context);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      // JSON parsing error
      throw new APIError(
        'Invalid JSON in request body',
        400,
        ERROR_CODES.INVALID_INPUT
      );
    }
  };
}

/**
 * Logging Middleware
 */
export function loggingMiddleware(options = {}) {
  const { 
    logRequests = true, 
    logResponses = true, 
    logErrors = true,
    excludePaths = ['/api/health']
  } = options;

  return (handler) => async (request, context) => {
    const startTime = Date.now();
    const method = request.method;
    const url = new URL(request.url).pathname;
    const userAgent = request.headers.get('user-agent');
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Skip logging for excluded paths
    if (excludePaths.includes(url)) {
      return await handler(request, context);
    }

    if (logRequests) {
      console.log(`📥 ${method} ${url} - ${clientIp} - ${userAgent}`);
    }

    try {
      const response = await handler(request, context);
      const duration = Date.now() - startTime;

      if (logResponses) {
        console.log(`📤 ${method} ${url} - ${response.status} - ${duration}ms`);
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      if (logErrors) {
        console.error(`❌ ${method} ${url} - Error after ${duration}ms:`, {
          error: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          clientIp,
          userAgent
        });
      }

      throw error;
    }
  };
}

/**
 * Security Headers Middleware
 */
export function securityMiddleware() {
  return (handler) => async (request, context) => {
    const response = await handler(request, context);

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // Only add HSTS in production with HTTPS
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    return response;
  };
}

/**
 * Method Validation Middleware
 */
export function methodMiddleware(allowedMethods = ['GET', 'POST']) {
  return (handler) => async (request, context) => {
    if (!allowedMethods.includes(request.method)) {
      return NextResponse.json({
        success: false,
        error: {
          code: ERROR_CODES.METHOD_NOT_ALLOWED,
          message: `Method ${request.method} not allowed`,
          allowedMethods
        }
      }, { 
        status: 405,
        headers: {
          'Allow': allowedMethods.join(', ')
        }
      });
    }

    return await handler(request, context);
  };
}

/**
 * Compose multiple middleware functions
 */
export function compose(...middlewares) {
  return (handler) => {
    return middlewares.reduceRight((acc, middleware) => {
      return middleware(acc);
    }, handler);
  };
}

/**
 * Common middleware combinations
 */
export const standardMiddleware = compose(
  loggingMiddleware(),
  securityMiddleware(),
  corsMiddleware()
);

export const protectedMiddleware = compose(
  loggingMiddleware(),
  securityMiddleware(),
  corsMiddleware(),
  rateLimitMiddleware(50, 15 * 60 * 1000), // 50 requests per 15 minutes
  authMiddleware(true)
);

export const creditProtectedMiddleware = (action, credits = 1) => compose(
  loggingMiddleware(),
  securityMiddleware(),
  corsMiddleware(),
  rateLimitMiddleware(30, 15 * 60 * 1000), // 30 requests per 15 minutes for credit actions
  creditMiddleware(action, credits)
);

/**
 * Example usage:
 * 
 * // Basic protected route
 * export const POST = protectedMiddleware(async (request) => {
 *   // Your handler logic here
 *   return NextResponse.json({ success: true });
 * });
 * 
 * // Credit-protected route
 * export const POST = creditProtectedMiddleware('resume_parse', 1)(async (request) => {
 *   // Your handler logic here
 *   return NextResponse.json({ success: true });
 * });
 * 
 * // Custom middleware combination
 * export const POST = compose(
 *   loggingMiddleware(),
 *   rateLimitMiddleware(10, 60 * 1000),
 *   validationMiddleware({
 *     query: { required: true, type: 'string', minLength: 2 }
 *   })
 * )(async (request) => {
 *   const { query } = request.validatedBody;
 *   // Your handler logic here
 * });
 */