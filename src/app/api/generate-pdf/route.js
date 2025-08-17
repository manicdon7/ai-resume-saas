import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request) {
  let browser = null;

  try {
    const body = await request.json();
    const resumeContent = body.content;
    const jobDescription = body.jobDescription;
    const name = body.name;

    if (!resumeContent || !name) {
      return NextResponse.json(
        { error: 'Resume content and name are required' },
        { status: 400 }
      );
    }

    const finalJobDescription = jobDescription || 'General position application';

    // Generate dynamic cover letter using Pollinations.ai
    let dynamicCoverLetter = '';
    const coverLetterPrompt = `Write a professional cover letter for ${name} applying for the position described below. Use the resume information to highlight relevant experience and skills.

RESUME CONTENT:
${resumeContent}

JOB DESCRIPTION:
${finalJobDescription}

Requirements for the cover letter:
1. Write in first person as ${name}
2. Include specific company name and position title from the job description (if available)
3. Highlight 2-3 most relevant experiences from the resume
4. Show genuine enthusiasm for the role and company
5. Keep it professional but engaging
6. Write 3-4 paragraphs
7. Do NOT include placeholders like [Company Name] - use actual details when available
8. Do NOT include "Sincerely" or closing signature - just the body text
9. Make each paragraph flow naturally without bullet points
10. Tailor the tone to match the company culture evident in the job posting

Write only the body paragraphs of the cover letter, no headers, no signatures.`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const aiRes = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: coverLetterPrompt }],
          model: 'openai'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (aiRes.ok) {
        const aiText = await aiRes.text();
        dynamicCoverLetter = aiText
          .replace(/```/g, '')
          .replace(/\*\*/g, '')
          .replace(/#{1,6}\s*/g, '')
          .replace(/^\s*-\s*/gm, '')
          .replace(/Dear\s+.*?,?\s*/i, '')
          .replace(/(Sincerely|Best regards|Thank you).*$/i, '')
          .trim();
      } else {
        throw new Error('AI API failed');
      }
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      dynamicCoverLetter = `I am writing to express my strong interest in this position. After reviewing the requirements, I believe my background and experience make me an excellent candidate for this role.

My professional experience has provided me with the skills and knowledge necessary to excel in this position. I am particularly drawn to this opportunity because it aligns perfectly with my career goals and passion for contributing to innovative projects.

I am excited about the possibility of bringing my expertise to your team and would welcome the opportunity to discuss how my background can contribute to your organization's continued success.`;
    }

    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Clean and split paragraphs properly
    const paragraphs = dynamicCoverLetter
      .split(/\n\s*\n/) // Split on double line breaks
      .map(p => p.replace(/\s+/g, ' ').trim()) // Clean up whitespace
      .filter(p => p.length > 20); // Filter out very short paragraphs

    // Escape HTML entities properly
    const escapeHtml = (text) => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    const safeName = escapeHtml(name);
    const safeFileName = name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');

    // Create properly structured HTML
    const fullHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeName}'s Cover Letter</title>
  <style>
    @page {
      size: A4;
      margin: 1in;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #2c3e50;
      background: white;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 1in;
    }
    
    .header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #3498db;
    }
    
    .title {
      font-size: 20pt;
      font-weight: bold;
      color: #2c3e50;
      font-family: Arial, sans-serif;
      margin-bottom: 0.5rem;
    }
    
    .date {
      text-align: right;
      margin-bottom: 2rem;
      font-size: 12pt;
    }
    
    .greeting {
      margin-bottom: 1.5rem;
      font-size: 12pt;
    }
    
    .paragraph {
      margin-bottom: 1.5rem;
      text-align: justify;
      font-size: 12pt;
      line-height: 1.6;
    }
    
    .closing {
      margin-top: 1.5rem;
      margin-bottom: 1.5rem;
      font-size: 12pt;
    }
    
    .signature {
      margin-top: 3rem;
      font-size: 12pt;
    }
    
    .signature-line {
      margin-bottom: 0.5rem;
    }
    
    .name {
      margin-top: 1rem;
      font-weight: bold;
    }

    @media print {
      body {
        padding: 0;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">Cover Letter</div>
  </div>
  
  <div class="date">${currentDate}</div>
  
  <div class="greeting">Dear Hiring Manager,</div>
  
  ${paragraphs.map(paragraph => 
    `<div class="paragraph">${escapeHtml(paragraph)}</div>`
  ).join('')}
  
  <div class="closing">Thank you for considering my application. I look forward to hearing from you soon.</div>
  
  <div class="signature">
    <div class="signature-line">Sincerely,</div>
    <div class="name">${safeName}</div>
  </div>
</body>
</html>`;

    // Generate PDF using Puppeteer
    console.log('Starting PDF generation with Puppeteer...');
    
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      executablePath: process.env.NODE_ENV === 'production' 
        ? process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable'
        : undefined
    });

    const page = await browser.newPage();
    
    // Set content and wait for it to load
    await page.setContent(fullHtmlContent, { 
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30000 
    });

    // Wait a bit more for fonts to load
    await page.evaluateHandle('document.fonts.ready');
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '1in',
        right: '1in',
        bottom: '1in',
        left: '1in'
      },
      printBackground: true,
      preferCSSPageSize: true,
      timeout: 30000
    });

    await browser.close();
    browser = null;

    console.log('PDF generated successfully');

    // Return PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFileName}_Cover_Letter.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    
    // Ensure browser is closed in case of error
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }

    // Try to generate a fallback HTML if PDF fails
    try {
      const safeName = name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      const fallbackHtml = `<!DOCTYPE html>
<html><head><title>Cover Letter - PDF Generation Failed</title></head>
<body><h1>PDF Generation Failed</h1><p>There was an error generating the PDF. Please try again or contact support.</p></body></html>`;
      
      return new NextResponse(fallbackHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="${safeName}_Cover_Letter.html"`
        }
      });
    } catch (fallbackError) {
      return NextResponse.json({
        error: 'Error generating cover letter',
        details: process.env.NODE_ENV === 'development' ? error.message : 'PDF generation failed'
      }, { status: 500 });
    }
  }
}