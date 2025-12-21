import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/credits-service';

export async function POST(request) {
  try {
    const { action, requiredCredits = 1 } = await request.json();
    
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('authorization');
    const { user } = await validateUser(authHeader);

    // Check if user has pro subscription
    if (user.isPro) {
      return NextResponse.json({
        success: true,
        hasCredits: true,
        credits: 'unlimited',
        isPro: true,
        action
      });
    }

    // Check regular credits
    const currentCredits = user.credits || 0;
    const hasCredits = currentCredits >= requiredCredits;

    return NextResponse.json({
      success: true,
      hasCredits,
      credits: currentCredits,
      isPro: false,
      requiredCredits,
      action
    });

  } catch (error) {
    console.error('Credit validation error:', error);
    
    if (error.message === 'UNAUTHORIZED' || error.message === 'INVALID_TOKEN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (error.message === 'USER_NOT_FOUND') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}