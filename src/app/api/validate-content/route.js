import { NextResponse } from 'next/server';
import { CreditsService } from '../../../lib/credits-service';

export async function POST(request) {
  try {
    // --- Credit System Start ---
    const creditResult = await CreditsService.middleware(request, CreditsService.CREDIT_ACTIONS.GENERAL);
    
    if (creditResult.response) {
      return creditResult.response;
    }
    
    const { user, isPro, transaction } = creditResult;
    // --- Credit System End ---
    const { text, type } = await request.json();

    if (!text || !type) {
      return NextResponse.json(
        { error: 'Text and type are required' },
        { status: 400 }
      );
    }

    // Create validation prompt based on type
    const validationPrompt = type === 'resume' 
      ? `Analyze if this text is a resume or CV. Look for:
- Personal information (name, contact details)
- Work experience or employment history
- Education background
- Skills section
- Professional summary or objective

Text to analyze:
${text}

Respond with only: VALID_RESUME or INVALID_RESUME followed by a brief reason.`
      : `Analyze if this text is a job description. Look for:
- Job title or position name
- Company information
- Job responsibilities and duties
- Required qualifications or skills
- Employment type (full-time, part-time, etc.)

Text to analyze:
${text}

Respond with only: VALID_JOB_DESC or INVALID_JOB_DESC followed by a brief reason.`;

    // Call AI for validation
    const apiRes = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{
          role: "user",
          content: validationPrompt
        }],
        model: "openai"
      }),
    });

    if (!apiRes.ok) {
      throw new Error('Validation service unavailable');
    }

    const result = await apiRes.text();
    const isValid = result.includes('VALID_');
    const reason = result.split(' ').slice(1).join(' ').trim();

    return NextResponse.json({
      isValid,
      reason: reason || 'Content validated',
      type
    });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: 'Validation failed', isValid: true }, // Default to valid if validation fails
      { status: 200 }
    );
  }
}