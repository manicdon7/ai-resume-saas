import { NextResponse } from 'next/server';

/**
 * Standardized API Error Handler
 * Provides consistent error responses across all API routes
 */

export class APIError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  FORBIDDEN: 'FORBIDDEN',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Resources
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  
  // Credits & Billing
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  CREDIT_LIMIT_EXCEEDED: 'CREDIT_LIMIT_EXCEEDED',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  
  // External Services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  
  // General
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED'
};

export const ERROR_MESSAGES = {
  [ERROR_CODES.UNAUTHORIZED]: 'Authentication required',
  [ERROR_CODES.INVALID_TOKEN]: 'Invalid or malformed token',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Token has expired',
  [ERROR_CODES.FORBIDDEN]: 'Access denied',
  [ERROR_CODES.VALIDATION_ERROR]: 'Validation failed',
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Required field is missing',
  [ERROR_CODES.INVALID_INPUT]: 'Invalid input provided',
  [ERROR_CODES.USER_NOT_FOUND]: 'User not found',
  [ERROR_CODES.RESOURCE_NOT_FOUND]: 'Resource not found',
  [ERROR_CODES.RESOURCE_ALREADY_EXISTS]: 'Resource already exists',
  [ERROR_CODES.INSUFFICIENT_CREDITS]: 'Insufficient credits',
  [ERROR_CODES.CREDIT_LIMIT_EXCEEDED]: 'Credit limit exceeded',
  [ERROR_CODES.PAYMENT_REQUIRED]: 'Payment required',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
  [ERROR_CODES.TOO_MANY_REQUESTS]: 'Too many requests',
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 'External service error',
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
  [ERROR_CODES.DATABASE_ERROR]: 'Database operation failed',
  [ERROR_CODES.CONNECTION_ERROR]: 'Connection failed',
  [ERROR_CODES.INTERNAL_ERROR]: 'Internal server error',
  [ERROR_CODES.BAD_REQUEST]: 'Bad request',
  [ERROR_CODES.METHOD_NOT_ALLOWED]: 'Method not allowed'
};

/**
 * Create standardized error response
 */
export function createErrorResponse(error, request = null) {
  let statusCode = 500;
  let code = ERROR_CODES.INTERNAL_ERROR;
  let message = ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR];
  let details = null;

  if (error instanceof APIError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error.message) {
    // Handle known error patterns
    switch (error.message) {
      case 'UNAUTHORIZED':
        statusCode = 401;
        code = ERROR_CODES.UNAUTHORIZED;
        message = ERROR_MESSAGES[ERROR_CODES.UNAUTHORIZED];
        break;
      case 'INVALID_TOKEN':
        statusCode = 401;
        code = ERROR_CODES.INVALID_TOKEN;
        message = ERROR_MESSAGES[ERROR_CODES.INVALID_TOKEN];
        break;
      case 'USER_NOT_FOUND':
        statusCode = 404;
        code = ERROR_CODES.USER_NOT_FOUND;
        message = ERROR_MESSAGES[ERROR_CODES.USER_NOT_FOUND];
        break;
      default:
        message = error.message;
    }
  }

  // Log error for debugging (exclude sensitive information)
  const logData = {
    timestamp: new Date().toISOString(),
    statusCode,
    code,
    message,
    url: request?.url,
    method: request?.method,
    userAgent: request?.headers?.get('user-agent'),
    ip: request?.headers?.get('x-forwarded-for') || request?.headers?.get('x-real-ip'),
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  };

  console.error('API Error:', logData);

  const response = {
    success: false,
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  };

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandler(handler) {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return createErrorResponse(error, request);
    }
  };
}

/**
 * Validation helper
 */
export function validateRequired(data, requiredFields) {
  const missing = [];
  
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    throw new APIError(
      `Missing required fields: ${missing.join(', ')}`,
      400,
      ERROR_CODES.MISSING_REQUIRED_FIELD,
      { missingFields: missing }
    );
  }
}

/**
 * Input sanitization helper
 */
export function sanitizeInput(input, maxLength = 1000) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Basic XSS prevention
}

/**
 * Rate limiting helper
 */
const rateLimitMap = new Map();

export function checkRateLimit(identifier, maxRequests = 100, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitMap.has(identifier)) {
    rateLimitMap.set(identifier, []);
  }
  
  const requests = rateLimitMap.get(identifier);
  
  // Remove old requests outside the window
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  
  if (validRequests.length >= maxRequests) {
    throw new APIError(
      'Rate limit exceeded',
      429,
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      {
        limit: maxRequests,
        windowMs,
        retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000)
      }
    );
  }
  
  validRequests.push(now);
  rateLimitMap.set(identifier, validRequests);
  
  return {
    remaining: maxRequests - validRequests.length,
    resetTime: windowStart + windowMs
  };
}

/**
 * Success response helper
 */
export function createSuccessResponse(data, statusCode = 200) {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  }, { status: statusCode });
}

/**
 * Paginated response helper
 */
export function createPaginatedResponse(items, total, page, limit, statusCode = 200) {
  const totalPages = Math.ceil(total / limit);
  
  return NextResponse.json({
    success: true,
    data: {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    },
    timestamp: new Date().toISOString()
  }, { status: statusCode });
}