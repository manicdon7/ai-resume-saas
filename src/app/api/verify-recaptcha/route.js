import { NextResponse } from 'next/server';
import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';

export async function POST(request) {
  try {
    const { token, action } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'reCAPTCHA token is required' },
        { status: 400 }
      );
    }

    // Create the reCAPTCHA client
    const client = new RecaptchaEnterpriseServiceClient();
    const projectPath = client.projectPath('rolefit-ai-cca18');

    // Build the assessment request
    const assessmentRequest = {
      assessment: {
        event: {
          token: token,
          siteKey: '6LfvYagrAAAAALymrNmW7_aKDSU0CGBdQrf8HbiJ',
        },
      },
      parent: projectPath,
    };

    const [response] = await client.createAssessment(assessmentRequest);

    // Check if the token is valid
    if (!response.tokenProperties.valid) {
      console.log(`The CreateAssessment call failed because the token was: ${response.tokenProperties.invalidReason}`);
      return NextResponse.json(
        { 
          error: 'Invalid reCAPTCHA token',
          score: 0.1,
          valid: false 
        },
        { status: 400 }
      );
    }

    // Check if the expected action was executed
    if (response.tokenProperties.action === action) {
      const riskScore = response.riskAnalysis.score;
      
      // Check if the risk score is acceptable (above 0.5 is generally good)
      const isAcceptable = riskScore > 0.5;
      
      if (!isAcceptable) {
        return NextResponse.json(
          { 
            error: 'reCAPTCHA risk score too low',
            score: riskScore,
            valid: false 
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        score: riskScore,
        valid: true,
        action: action,
        message: 'reCAPTCHA verification successful'
      });
    } else {
      return NextResponse.json(
        { 
          error: 'reCAPTCHA action mismatch',
          score: 0.1,
          valid: false 
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error during reCAPTCHA verification' },
      { status: 500 }
    );
  }
}
