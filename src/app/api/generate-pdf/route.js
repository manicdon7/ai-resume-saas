import { NextResponse } from 'next/server';

export async function POST(request) {
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
      font-size: 11pt;
      line-height: 1.5;
      color: #2c3e50;
      background: white;
    }
    
    .container {
      width: 100%;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.5in;
    }
    
    .header {
      text-align: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #3498db;
    }
    
    .title {
      font-size: 18pt;
      font-weight: bold;
      color: #2c3e50;
      font-family: Arial, sans-serif;
      margin-bottom: 0.5rem;
    }
    
    .date {
      text-align: right;
      margin-bottom: 1.5rem;
      font-size: 11pt;
    }
    
    .greeting {
      margin-bottom: 1rem;
      font-size: 11pt;
    }
    
    .paragraph {
      margin-bottom: 1rem;
      text-align: justify;
      font-size: 11pt;
      line-height: 1.6;
    }
    
    .closing {
      margin-top: 1rem;
      margin-bottom: 1rem;
      font-size: 11pt;
    }
    
    .signature {
      margin-top: 2rem;
      font-size: 11pt;
    }
    
    .signature-line {
      margin-bottom: 0.5rem;
    }
    
    .name {
      margin-top: 1rem;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
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
  </div>
</body>
</html>`;

    let pdfBuffer = null;

    // Method 1: Try PDFShift (most reliable)
    if (process.env.PDFSHIFT_API_KEY) {
      try {
        console.log('Trying PDFShift...');
        const pdfResponse = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`api:${process.env.PDFSHIFT_API_KEY}`).toString('base64')}`
          },
          body: JSON.stringify({
            source: fullHtmlContent,
            landscape: false,
            format: 'A4',
            margin: '1in',
            print_background: true,
            delay: 2000,
            timeout: 30
          })
        });

        if (pdfResponse.ok) {
          pdfBuffer = await pdfResponse.arrayBuffer();
          console.log('PDFShift success');
        } else {
          const errorText = await pdfResponse.text();
          console.error('PDFShift error:', errorText);
          throw new Error(`PDFShift failed: ${pdfResponse.status}`);
        }
      } catch (pdfError) {
        console.error('PDFShift failed:', pdfError);
      }
    }

    // // Method 2: Try HTML/CSS to Image API
    // if (!pdfBuffer && process.env.HCTI_USER_ID && process.env.HCTI_API_KEY) {
    //   try {
    //     console.log('Trying HCTI...');
    //     const hctiResponse = await fetch('https://hcti.io/v1/image', {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Basic ${Buffer.from(`${process.env.HCTI_USER_ID}:${process.env.HCTI_API_KEY}`).toString('base64')}`
    //       },
    //       body: JSON.stringify({
    //         html: fullHtmlContent,
    //         format: 'pdf',
    //         width: 794, // A4 width in pixels at 96 DPI
    //         height: 1123, // A4 height in pixels at 96 DPI
    //         quality: 100,
    //         device_scale: 2
    //       })
    //     });

    //     if (hctiResponse.ok) {
    //       const hctiData = await hctiResponse.json();
    //       if (hctiData.url) {
    //         const pdfFile = await fetch(hctiData.url);
    //         pdfBuffer = await pdfFile.arrayBuffer();
    //         console.log('HCTI success');
    //       }
    //     } else {
    //       const errorText = await hctiResponse.text();
    //       console.error('HCTI error:', errorText);
    //     }
    //   } catch (hctiError) {
    //     console.error('HCTI failed:', hctiError);
    //   }
    // }

    // Method 3: Try Puppeteer (remove this section as it won't work reliably on Vercel)
    // Keeping the original code structure but skipping Puppeteer entirely

    // If PDF generation succeeded, return PDF
    if (pdfBuffer && pdfBuffer.byteLength > 0) {
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${safeFileName}_Cover_Letter.pdf"`,
          'Content-Length': pdfBuffer.byteLength.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }

    // Fallback: Return properly formatted HTML
    console.log('All PDF methods failed, returning HTML fallback');
    const htmlBuffer = Buffer.from(fullHtmlContent, 'utf-8');

    return new NextResponse(htmlBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${safeFileName}_Cover_Letter.html"`,
        'Content-Length': htmlBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    
    return NextResponse.json({
      error: 'Error generating cover letter',
      details: process.env.NODE_ENV === 'development' ? error.message : 'PDF generation failed'
    }, { status: 500 });
  }
}