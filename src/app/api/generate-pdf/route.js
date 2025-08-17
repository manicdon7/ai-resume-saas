import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request) {
  let browser = null;
  try {
    // Parse request body
    const body = await request.json();
    const resumeContent = body.content;
    const jobDescription = body.jobDescription;
    const name = body.name;

    // Validate input
    if (!resumeContent || !jobDescription || !name) {
      return NextResponse.json(
        { error: 'Resume content, job description, and name are required' },
        { status: 400 }
      );
    }

    // Generate dynamic cover letter using Pollinations.ai
    let dynamicCoverLetter = '';
    const coverLetterPrompt = `Write a professional cover letter for ${name} applying for the position described below. Use the resume information to highlight relevant experience and skills.

RESUME CONTENT:
${resumeContent}

JOB DESCRIPTION:
${jobDescription}

Requirements for the cover letter:
1. Write in first person as ${name}
2. Include specific company name and position title from the job description
3. Highlight 2-3 most relevant experiences from the resume
4. Show genuine enthusiasm for the role and company
5. Keep it professional but engaging
6. Write 3-4 paragraphs
7. Do NOT include placeholders like [Company Name] - use actual details
8. Do NOT include "Sincerely" or closing signature - just the body text
9. Make each paragraph flow naturally without bullet points
10. Tailor the tone to match the company culture evident in the job posting

Write only the body paragraphs of the cover letter, no headers, no signatures.`;

    try {
      const aiRes = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ 
            role: 'user', 
            content: coverLetterPrompt 
          }],
          model: 'openai'
        }),
      });

      if (aiRes.ok) {
        const aiText = await aiRes.text();
        // Clean up the response - remove any extra formatting
        dynamicCoverLetter = aiText
          .replace(/```/g, '') // Remove code blocks
          .replace(/\*\*/g, '') // Remove bold markdown
          .replace(/#{1,6}\s*/g, '') // Remove headers
          .replace(/^\s*-\s*/gm, '') // Remove bullet points
          .trim();
      } else {
        console.error('AI API error:', aiRes.status, aiRes.statusText);
        // Fallback cover letter
        dynamicCoverLetter = `Dear Hiring Manager,

I am writing to express my strong interest in the position at your company. After reviewing the job description, I believe my background and experience make me an excellent candidate for this role.

My professional experience has provided me with the skills and knowledge necessary to excel in this position. I am particularly drawn to this opportunity because it aligns perfectly with my career goals and passion for contributing to innovative projects.

I am excited about the possibility of bringing my expertise to your team and would welcome the opportunity to discuss how my background can contribute to your organization's continued success.

Thank you for considering my application. I look forward to hearing from you soon.`;
      }
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      // Fallback cover letter
      dynamicCoverLetter = `Dear Hiring Manager,

I am writing to express my strong interest in the position at your company. After reviewing the job description, I believe my background and experience make me an excellent candidate for this role.

My professional experience has provided me with the skills and knowledge necessary to excel in this position. I am particularly drawn to this opportunity because it aligns perfectly with my career goals and passion for contributing to innovative projects.

I am excited about the possibility of bringing my expertise to your team and would welcome the opportunity to discuss how my background can contribute to your organization's continued success.

Thank you for considering my application. I look forward to hearing from you soon.`;
    }

    // Get current date in proper format
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Generate cover letter HTML with proper formatting
    let coverLetterHtml = '<div class="cover-letter-section">';
    coverLetterHtml += '<h1 class="cover-letter-title">Cover Letter</h1>';
    coverLetterHtml += `<p class="date">${currentDate}</p>`;
    
    // Split into paragraphs and format properly
    const paragraphs = dynamicCoverLetter
      .split('\n\n')
      .filter(p => p.trim().length > 0)
      .map(p => p.trim());
    
    paragraphs.forEach(paragraph => {
      // Skip empty paragraphs and clean up formatting
      const cleanParagraph = paragraph
        .replace(/^(Dear.*?,\s*)/i, '') // Remove "Dear..." if it exists
        .replace(/^(Sincerely.*|Best regards.*|Thank you.*)/i, '') // Remove closings
        .trim();
      
      if (cleanParagraph && cleanParagraph.length > 10) {
        coverLetterHtml += `<p class="letter-paragraph">${cleanParagraph}</p>`;
      }
    });
    
    // Add proper closing
    coverLetterHtml += `<p class="closing">Sincerely,<br><br>${name}</p>`;
    coverLetterHtml += '</div>';

    // Create complete HTML document
    const fullHtmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${name}'s Cover Letter</title>
          <style>
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            body {
              font-family: 'Times New Roman', Times, serif;
              line-height: 1.6;
              color: #2c3e50;
              background: white;
              font-size: 12pt;
            }
            
            .content {
              max-width: 8.5in;
              margin: 0 auto;
              padding: 1in;
              min-height: 11in;
            }
            
            .cover-letter-section {
              margin: 0;
            }
            
            .cover-letter-title {
              font-size: 24pt;
              font-weight: bold;
              color: #2c3e50;
              text-align: center;
              margin-bottom: 24pt;
              padding-bottom: 12pt;
              border-bottom: 3pt solid #3498db;
              font-family: Arial, sans-serif;
            }
            
            .date {
              text-align: right;
              margin-bottom: 36pt;
              font-size: 12pt;
            }
            
            .letter-paragraph {
              margin: 18pt 0;
              line-height: 1.6;
              text-align: justify;
              text-indent: 0;
              font-size: 12pt;
            }
            
            .letter-paragraph:first-of-type {
              margin-top: 0;
            }
            
            .closing {
              margin-top: 36pt;
              text-align: left;
              font-size: 12pt;
            }
            
            @page {
              size: A4;
              margin: 1in;
            }
            
            @media print {
              body {
                font-size: 12pt;
                margin: 0;
                padding: 0;
              }
              
              .content {
                padding: 0;
                max-width: none;
                width: 100%;
              }
              
              .cover-letter-title {
                font-size: 22pt;
                margin-bottom: 20pt;
                padding-bottom: 10pt;
              }
              
              .date {
                margin-bottom: 30pt;
              }
              
              .letter-paragraph {
                margin: 15pt 0;
              }
              
              .closing {
                margin-top: 30pt;
              }
            }
          </style>
        </head>
        <body>
          <div class="content">
            ${coverLetterHtml}
          </div>
        </body>
      </html>
    `;

    // Generate PDF using Puppeteer
    browser = await puppeteer.launch({
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ],
      headless: 'new',
    });
    
    const page = await browser.newPage();
    await page.setContent(fullHtmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Wait a bit more to ensure content is fully rendered
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0.5in',
        bottom: '0.5in',
        left: '0.75in',
        right: '0.75in',
      },
      displayHeaderFooter: false,
    });
    
    await browser.close();
    browser = null;

    // Create safe filename
    const safeFileName = name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFileName}_Cover_Letter.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    
    // Ensure browser is closed
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Browser close error:', closeError);
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Error generating cover letter PDF', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}