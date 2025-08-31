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

    // For multiple credits, we need to consume them one by one
    let totalConsumed = 0;
    let transactions = [];
    let finalResult = null;

    for (let i = 0; i < amount; i++) {
      const result = await CreditsService.checkAndConsumeCredit(authHeader, action);
      
      if (!result.success) {
        // If we fail partway through, we need to handle partial consumption
        return NextResponse.json({
          error: result.error,
          credits: result.credits,
          isPro: result.isPro,
          action: result.action,
          partialConsumption: totalConsumed > 0 ? totalConsumed : undefined
        }, { status: result.statusCode });
      }

      totalConsumed++;
      if (result.transaction) {
        transactions.push(result.transaction);
      }
      finalResult = result;
    }

    return NextResponse.json({
      success: true,
      credits: finalResult.credits,
      isPro: finalResult.isPro,
      consumed: totalConsumed,
      transactions,
      transaction: transactions[transactions.length - 1], // Latest transaction for compatibility
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