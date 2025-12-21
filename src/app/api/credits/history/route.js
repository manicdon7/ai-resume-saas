import { NextResponse } from 'next/server';
import { CreditsService } from '../../../../lib/credits-service';
import { withErrorHandler, APIError, ERROR_CODES } from '@/lib/api-error-handler';
import { protectedMiddleware } from '@/lib/api-middleware';

async function creditHistoryHandler(request) {
  const authHeader = request.headers.get('authorization');
  const { searchParams } = new URL(request.url);
  
  const options = {
    limit: Math.min(parseInt(searchParams.get('limit')) || 20, 100), // Max 100 items
    skip: Math.max(parseInt(searchParams.get('skip')) || 0, 0), // Min 0
    type: searchParams.get('type') || null
  };

  const result = await CreditsService.getCreditTransactionHistory(authHeader, options);
  
  if (!result.success) {
    throw new APIError(result.error, 400, ERROR_CODES.BAD_REQUEST);
  }

  return NextResponse.json({
    success: true,
    data: {
      transactions: result.transactions,
      pagination: {
        total: result.total,
        limit: options.limit,
        skip: options.skip,
        hasMore: result.total > (options.skip + options.limit)
      }
    },
    timestamp: new Date().toISOString()
  });
}

export const GET = protectedMiddleware(withErrorHandler(creditHistoryHandler));