import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { withErrorHandler, APIError, ERROR_CODES, validateRequired, sanitizeInput } from '@/lib/api-error-handler';
import { standardMiddleware } from '@/lib/api-middleware';

async function registerHandler(request) {
  const body = await request.json();
  const { email, password, name } = body;

  // Validate required fields
  validateRequired(body, ['email', 'password', 'name']);

  // Sanitize inputs
  const sanitizedEmail = sanitizeInput(email, 100).toLowerCase();
  const sanitizedName = sanitizeInput(name, 50);

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitizedEmail)) {
    throw new APIError('Invalid email format', 400, ERROR_CODES.INVALID_INPUT);
  }

  // Validate password strength
  if (password.length < 8) {
    throw new APIError('Password must be at least 8 characters long', 400, ERROR_CODES.INVALID_INPUT);
  }

  if (sanitizedName.length < 2) {
    throw new APIError('Name must be at least 2 characters long', 400, ERROR_CODES.INVALID_INPUT);
  }

  const client = await clientPromise;
  const db = client.db('roleFitAi');
  const users = db.collection('users');

  // Check if user already exists
  const existingUser = await users.findOne({ email: sanitizedEmail });
  if (existingUser) {
    throw new APIError('User already exists', 400, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const result = await users.insertOne({
    name: sanitizedName,
    email: sanitizedEmail,
    password: hashedPassword,
    isPro: false,
    credits: 3,
    lastCreditReset: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: new Date()
  });

  // Generate JWT token
  const token = jwt.sign(
    { userId: result.insertedId, email: sanitizedEmail, isPro: false },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return NextResponse.json({
    success: true,
    data: {
      token,
      user: {
        id: result.insertedId,
        name: sanitizedName,
        email: sanitizedEmail,
        isPro: false,
        credits: 3
      }
    },
    message: 'User registered successfully',
    timestamp: new Date().toISOString()
  });
}

export const POST = standardMiddleware(withErrorHandler(registerHandler));