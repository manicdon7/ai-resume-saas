import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { withErrorHandler, APIError, ERROR_CODES, validateRequired, sanitizeInput } from '@/lib/api-error-handler';
import { standardMiddleware } from '@/lib/api-middleware';

async function loginHandler(request) {
  const body = await request.json();
  const { email, password } = body;

  // Validate required fields
  validateRequired(body, ['email', 'password']);

  // Sanitize inputs
  const sanitizedEmail = sanitizeInput(email, 100).toLowerCase();

  const client = await clientPromise;
  const db = client.db('roleFitAi');
  const users = db.collection('users');

  // Find user
  const user = await users.findOne({ email: sanitizedEmail });
  if (!user) {
    throw new APIError('Invalid credentials', 401, ERROR_CODES.UNAUTHORIZED);
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new APIError('Invalid credentials', 401, ERROR_CODES.UNAUTHORIZED);
  }

  // Update last login
  await users.updateOne(
    { _id: user._id },
    { 
      $set: { 
        lastLogin: new Date(),
        updatedAt: new Date()
      } 
    }
  );

  // Generate JWT token
  const token = jwt.sign(
    { userId: user._id, email: user.email, isPro: user.isPro },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return NextResponse.json({
    success: true,
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isPro: user.isPro,
        credits: user.credits ?? 3
      }
    },
    message: 'Login successful',
    timestamp: new Date().toISOString()
  });
}

export const POST = standardMiddleware(withErrorHandler(loginHandler));