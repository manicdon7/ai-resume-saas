import { NextResponse } from 'next/server';
import { CreditsService } from '../../../../lib/credits-service';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const result = await CreditsService.getUserCredits(authHeader);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.statusCode });
    }

    return NextResponse.json({
      credits: result.credits === 'unlimited' ? 999 : result.credits,
      isPro: result.isPro,
      unlimited: result.credits === 'unlimited'
    });
  } catch (error) {
    console.error('Credits API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
