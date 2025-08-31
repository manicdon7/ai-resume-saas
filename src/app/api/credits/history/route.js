import { NextResponse } from 'next/server';
import { CreditsService } from '../../../../lib/credits-service';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    
    const options = {
      limit: parseInt(searchParams.get('limit')) || 20,
      skip: parseInt(searchParams.get('skip')) || 0,
      type: searchParams.get('type') || null
    };

    const result = await CreditsService.getCreditTransactionHistory(authHeader, options);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 400 }
      );
    }

    return NextResponse.json({
      transactions: result.transactions,
      total: result.total,
      limit: options.limit,
      skip: options.skip,
      hasMore: result.total > (options.skip + options.limit)
    });
  } catch (error) {
    console.error('Credit history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}