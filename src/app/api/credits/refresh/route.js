import { NextResponse } from 'next/server';
import { CreditsService } from '../../../../lib/credits-service';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    const result = await CreditsService.getRealTimeCredits(authHeader);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 400 }
      );
    }

    return NextResponse.json({
      credits: result.credits === 'unlimited' ? 999 : result.credits,
      isPro: result.isPro,
      unlimited: result.credits === 'unlimited',
      lastUpdated: result.lastUpdated,
      userId: result.userId
    });
  } catch (error) {
    console.error('Credit refresh API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}