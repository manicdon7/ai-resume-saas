import { NextResponse } from 'next/server';
import { CreditsService } from '../../../../lib/credits-service';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const { action, requiredCredits = 1 } = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' }, 
        { status: 400 }
      );
    }

    const result = await CreditsService.validateCreditOperation(
      authHeader, 
      action, 
      requiredCredits
    );

    if (!result.valid && result.error) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: result.valid,
      isPro: result.isPro,
      credits: result.credits,
      requiredCredits: result.requiredCredits,
      message: result.message,
      action
    });
  } catch (error) {
    console.error('Credit validation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}