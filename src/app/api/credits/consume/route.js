import { NextResponse } from 'next/server';
import { CreditsService } from '../../../../lib/credits-service';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const { action, amount = 1 } = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' }, 
        { status: 400 }
      );
    }

    if (amount < 1) {
      return NextResponse.json(
        { error: 'Amount must be at least 1' }, 
        { status: 400 }
      );
    }

    // First, validate user has enough credits for the entire operation
    const validationResult = await CreditsService.validateCreditsForAction(authHeader, action, amount);
    
    if (!validationResult.success) {
      return NextResponse.json({
        error: validationResult.error,
        credits: validationResult.credits,
        isPro: validationResult.isPro,
        action,
        requiredCredits: amount
      }, { status: validationResult.statusCode });
    }

    // If user is pro, no need to consume credits
    if (validationResult.isPro) {
      return NextResponse.json({
        success: true,
        credits: 'unlimited',
        isPro: true,
        consumed: 0,
        action,
        message: 'Pro user - no credits consumed'
      });
    }

    // Consume all credits atomically
    const consumeResult = await CreditsService.consumeCreditsAtomic(authHeader, action, amount);
    
    if (!consumeResult.success) {
      return NextResponse.json({
        error: consumeResult.error,
        credits: consumeResult.credits,
        isPro: consumeResult.isPro,
        action
      }, { status: consumeResult.statusCode });
    }

    return NextResponse.json({
      success: true,
      credits: consumeResult.credits,
      isPro: consumeResult.isPro,
      consumed: amount,
      transaction: consumeResult.transaction,
      action
    });
  } catch (error) {
    console.error('Credit consumption API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}