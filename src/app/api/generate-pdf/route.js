import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

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
      .split(/\n\s*\n/)
      .map(p => p.replace(/\s+/g, ' ').trim())
      .filter(p => p.length > 20);

    const safeFileName = name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');

    // Create PDF using pdf-lib
    console.log('Creating PDF with pdf-lib...');
    
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // US Letter size
    
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width, height } = page.getSize();
    const margin = 72; // 1 inch margins
    const contentWidth = width - 2 * margin;
    let yPosition = height - margin;

    // Helper function to wrap text
    function wrapText(text, font, fontSize, maxWidth) {
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        
        if (testWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            lines.push(word);
          }
        }
      }
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      return lines;
    }

    // Header - Cover Letter title
    const titleFontSize = 18;
    const titleWidth = helveticaBold.widthOfTextAtSize('Cover Letter', titleFontSize);
    page.drawText('Cover Letter', {
      x: (width - titleWidth) / 2,
      y: yPosition,
      size: titleFontSize,
      font: helveticaBold,
      color: rgb(0.17, 0.24, 0.31), // Dark blue-gray
    });

    // Underline
    yPosition -= 10;
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 2,
      color: rgb(0.2, 0.59, 0.86), // Blue
    });

    yPosition -= 40;

    // Date (right aligned)
    const dateText = currentDate;
    const dateFontSize = 11;
    const dateWidth = timesRomanFont.widthOfTextAtSize(dateText, dateFontSize);
    page.drawText(dateText, {
      x: width - margin - dateWidth,
      y: yPosition,
      size: dateFontSize,
      font: timesRomanFont,
      color: rgb(0.17, 0.24, 0.31),
    });

    yPosition -= 40;

    // Greeting
    page.drawText('Dear Hiring Manager,', {
      x: margin,
      y: yPosition,
      size: 11,
      font: timesRomanFont,
      color: rgb(0.17, 0.24, 0.31),
    });

    yPosition -= 30;

    // Cover letter paragraphs
    const paragraphFontSize = 11;
    const lineHeight = 16;
    
    for (const paragraph of paragraphs) {
      const lines = wrapText(paragraph, timesRomanFont, paragraphFontSize, contentWidth);
      
      for (const line of lines) {
        if (yPosition < margin + 100) {
          // Add new page if needed
          const newPage = pdfDoc.addPage([612, 792]);
          yPosition = height - margin;
          
          // Continue on new page
          newPage.drawText(line, {
            x: margin,
            y: yPosition,
            size: paragraphFontSize,
            font: timesRomanFont,
            color: rgb(0.17, 0.24, 0.31),
          });
        } else {
          page.drawText(line, {
            x: margin,
            y: yPosition,
            size: paragraphFontSize,
            font: timesRomanFont,
            color: rgb(0.17, 0.24, 0.31),
          });
        }
        
        yPosition -= lineHeight;
      }
      
      yPosition -= 10; // Extra space between paragraphs
    }

    yPosition -= 10;

    // Closing
    page.drawText('Thank you for considering my application. I look forward to hearing from you soon.', {
      x: margin,
      y: yPosition,
      size: 11,
      font: timesRomanFont,
      color: rgb(0.17, 0.24, 0.31),
    });

    yPosition -= 40;

    // Signature
    page.drawText('Sincerely,', {
      x: margin,
      y: yPosition,
      size: 11,
      font: timesRomanFont,
      color: rgb(0.17, 0.24, 0.31),
    });

    yPosition -= 30;

    page.drawText(name, {
      x: margin,
      y: yPosition,
      size: 11,
      font: timesRomanBold,
      color: rgb(0.17, 0.24, 0.31),
    });

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();

    console.log('PDF generated successfully with pdf-lib');

    // Return PDF
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFileName}_Cover_Letter.pdf"`,
        'Content-Length': pdfBytes.length.toString(),
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