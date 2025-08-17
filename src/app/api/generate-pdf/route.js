import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    const resumeContent = body.content;
    const jobDescription = body.jobDescription;
    const name = body.name;

    // Validate input
    if (!resumeContent || !name) {
      return NextResponse.json(
        { error: 'Resume content and name are required' },
        { status: 400 }
      );
    }

    // Use fallback job description if not provided
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
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

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
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (aiRes.ok) {
        const aiText = await aiRes.text();
        // Clean up the response - remove any extra formatting
        dynamicCoverLetter = aiText
          .replace(/```/g, '') // Remove code blocks
          .replace(/\*\*/g, '') // Remove bold markdown
          .replace(/#{1,6}\s*/g, '') // Remove headers
          .replace(/^\s*-\s*/gm, '') // Remove bullet points
          .replace(/Dear\s+.*?,?\s*/i, '') // Remove Dear greeting
          .replace(/(Sincerely|Best regards|Thank you).*$/i, '') // Remove closings
          .trim();
      } else {
        console.error('AI API error:', aiRes.status, aiRes.statusText);
        throw new Error('AI API failed');
      }
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      // Fallback cover letter
      dynamicCoverLetter = `I am writing to express my strong interest in this position. After reviewing the requirements, I believe my background and experience make me an excellent candidate for this role.

My professional experience has provided me with the skills and knowledge necessary to excel in this position. I am particularly drawn to this opportunity because it aligns perfectly with my career goals and passion for contributing to innovative projects.

I am excited about the possibility of bringing my expertise to your team and would welcome the opportunity to discuss how my background can contribute to your organization's continued success.`;
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
    coverLetterHtml += '<p class="greeting">Dear Hiring Manager,</p>';
    
    // Split into paragraphs and format properly
    const paragraphs = dynamicCoverLetter
      .split('\n\n')
      .filter(p => p.trim().length > 0)
      .map(p => p.trim());
    
    paragraphs.forEach(paragraph => {
      const cleanParagraph = paragraph.trim();
      if (cleanParagraph && cleanParagraph.length > 10) {
        coverLetterHtml += `<p class="letter-paragraph">${cleanParagraph}</p>`;
      }
    });
    
    // Add proper closing
    coverLetterHtml += `<p class="closing">Thank you for considering my application. I look forward to hearing from you soon.</p>`;
    coverLetterHtml += `<p class="signature">Sincerely,<br><br>${name}</p>`;
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
              border-bottom: 2pt solid #3498db;
              font-family: Arial, sans-serif;
            }
            
            .date {
              text-align: right;
              margin-bottom: 24pt;
              font-size: 12pt;
            }
            
            .greeting {
              margin-bottom: 18pt;
              font-size: 12pt;
            }
            
            .letter-paragraph {
              margin: 18pt 0;
              line-height: 1.6;
              text-align: justify;
              font-size: 12pt;
            }
            
            .closing {
              margin: 18pt 0;
              line-height: 1.6;
              font-size: 12pt;
            }
            
            .signature {
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

    // Try multiple PDF generation approaches
    let pdfBuffer = null;
    const safeFileName = name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');

    // Method 1: Try Puppeteer (requires proper setup in package.json and vercel.json)
    try {
      const puppeteer = await import('puppeteer');
      
      const browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      
      // Set timeout for page operations
      page.setDefaultTimeout(30000);
      
      await page.setContent(fullHtmlContent, {
        waitUntil: ['networkidle0', 'domcontentloaded']
      });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1in',
          right: '1in',
          bottom: '1in',
          left: '1in'
        }
      });

      await browser.close();
      pdfBuffer = pdf;

    } catch (puppeteerError) {
      console.error('Puppeteer failed:', puppeteerError);
      
      // Method 2: Try API-based PDF service (PDFShift, HTMLCSStoImage, etc.)
      try {
        // Using PDFShift as it has a generous free tier
        const pdfShiftResponse = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(process.env.PDFSHIFT_API_KEY || 'api:').toString('base64')}`
          },
          body: JSON.stringify({
            source: fullHtmlContent,
            landscape: false,
            format: 'A4',
            margin: '1in',
            print_background: true,
            delay: 1000
          })
        });

        if (pdfShiftResponse.ok && process.env.PDFSHIFT_API_KEY) {
          pdfBuffer = await pdfShiftResponse.arrayBuffer();
        } else {
          throw new Error('PDFShift failed or no API key');
        }
      } catch (apiError) {
        console.error('API PDF service failed:', apiError);
        
        // Method 3: Try browser-based jsPDF (client-side fallback)
        try {
          // This would require the jsPDF library
          const { jsPDF } = await import('jspdf');
          const doc = new jsPDF();
          
          // Convert HTML to text for PDF (basic approach)
          const tempDiv = { innerHTML: fullHtmlContent };
          const textContent = tempDiv.innerHTML
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          doc.text(textContent, 20, 20, { 
            maxWidth: 170,
            lineHeightFactor: 1.5
          });
          
          pdfBuffer = doc.output('arraybuffer');
        } catch (jsPDFError) {
          console.error('jsPDF failed:', jsPDFError);
        }
      }
    }

    // If PDF generation succeeded, return PDF
    if (pdfBuffer && pdfBuffer.byteLength > 0) {
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${safeFileName}_Cover_Letter.pdf"`,
          'Content-Length': pdfBuffer.byteLength.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
    }

    // Fallback: Return HTML as downloadable file
    console.log('All PDF methods failed, returning HTML fallback');
    const htmlBuffer = Buffer.from(fullHtmlContent, 'utf-8');

    return new NextResponse(htmlBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${safeFileName}_Cover_Letter.html"`,
        'Content-Length': htmlBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Error generating cover letter', 
        details: process.env.NODE_ENV === 'development' ? error.message : 'PDF generation failed',
        fallback: 'Please try again or check your network connection'
      },
      { status: 500 }
    );
  }
}