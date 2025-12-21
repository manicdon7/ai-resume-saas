import { NextResponse } from 'next/server';
import { CreditsService } from '../../../../lib/credits-service';
import { withErrorHandler, APIError, ERROR_CODES } from '@/lib/api-error-handler';
import { protectedMiddleware } from '@/lib/api-middleware';

async function creditsHandler(request) {
  const authHeader = request.headers.get('authorization');
  const result = await CreditsService.getUserCredits(authHeader);
  
  if (!result.success) {
    throw new APIError(result.error, result.statusCode, ERROR_CODES.UNAUTHORIZED);
  }

  return NextResponse.json({
    success: true,
    data: {
      credits: result.credits === 'unlimited' ? 999 : result.credits,
      isPro: result.isPro,
      unlimited: result.credits === 'unlimited',
      lastUpdated: result.lastUpdated
    },
    timestamp: new Date().toISOString()
  });
}

export const GET = protectedMiddleware(withErrorHandler(creditsHandler));
