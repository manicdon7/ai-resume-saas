import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function POST(request) {
  try {
    const body = await request.json();
    const resumeContent = body.resumeContent;
    const jobDescription = body.jobDescription;
    const name = body.name;
    const includeCoverLetter = body.includeCoverLetter || true;

    if (!resumeContent || !name) {
      return NextResponse.json(
        { error: 'Resume content and name are required' },
        { status: 400 }
      );
    }

    const finalJobDescription = jobDescription || 'General position application';

    // Generate dynamic cover letter if requested
    let dynamicCoverLetter = '';
    if (includeCoverLetter) {
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
    }

    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create PDF using pdf-lib
    const pdfDoc = await PDFDocument.create();
    
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 612;
    const pageHeight = 792;
    const margin = 72;
    const contentWidth = pageWidth - 2 * margin;

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

    // Function to add new page if needed
    function checkNewPage(currentPage, yPosition) {
      if (yPosition < margin + 50) {
        return { page: pdfDoc.addPage([pageWidth, pageHeight]), y: pageHeight - margin };
      }
      return { page: currentPage, y: yPosition };
    }

    // Add Cover Letter if requested
    if (includeCoverLetter && dynamicCoverLetter) {
      let coverPage = pdfDoc.addPage([pageWidth, pageHeight]);
      let yPosition = pageHeight - margin;

      // Cover Letter Header
      const titleFontSize = 18;
      const titleWidth = helveticaBold.widthOfTextAtSize('Cover Letter', titleFontSize);
      coverPage.drawText('Cover Letter', {
        x: (pageWidth - titleWidth) / 2,
        y: yPosition,
        size: titleFontSize,
        font: helveticaBold,
        color: rgb(0.17, 0.24, 0.31),
      });

      // Underline
      yPosition -= 10;
      coverPage.drawLine({
        start: { x: margin, y: yPosition },
        end: { x: pageWidth - margin, y: yPosition },
        thickness: 2,
        color: rgb(0.2, 0.59, 0.86),
      });

      yPosition -= 40;

      // Date (right aligned)
      const dateText = currentDate;
      const dateFontSize = 11;
      const dateWidth = timesRomanFont.widthOfTextAtSize(dateText, dateFontSize);
      coverPage.drawText(dateText, {
        x: pageWidth - margin - dateWidth,
        y: yPosition,
        size: dateFontSize,
        font: timesRomanFont,
        color: rgb(0.17, 0.24, 0.31),
      });

      yPosition -= 40;

      // Greeting
      coverPage.drawText('Dear Hiring Manager,', {
        x: margin,
        y: yPosition,
        size: 11,
        font: timesRomanFont,
        color: rgb(0.17, 0.24, 0.31),
      });

      yPosition -= 30;

      // Cover letter paragraphs
      const paragraphs = dynamicCoverLetter
        .split(/\n\s*\n/)
        .map(p => p.replace(/\s+/g, ' ').trim())
        .filter(p => p.length > 20);

      const paragraphFontSize = 11;
      const lineHeight = 16;
      
      for (const paragraph of paragraphs) {
        const lines = wrapText(paragraph, timesRomanFont, paragraphFontSize, contentWidth);
        
        for (const line of lines) {
          const pageCheck = checkNewPage(coverPage, yPosition);
          coverPage = pageCheck.page;
          yPosition = pageCheck.y;
          
          coverPage.drawText(line, {
            x: margin,
            y: yPosition,
            size: paragraphFontSize,
            font: timesRomanFont,
            color: rgb(0.17, 0.24, 0.31),
          });
          
          yPosition -= lineHeight;
        }
        
        yPosition -= 10; // Extra space between paragraphs
      }

      yPosition -= 10;

      // Closing
      const pageCheck1 = checkNewPage(coverPage, yPosition - 40);
      coverPage = pageCheck1.page;
      yPosition = pageCheck1.y;

      coverPage.drawText('Thank you for considering my application. I look forward to hearing from you soon.', {
        x: margin,
        y: yPosition,
        size: 11,
        font: timesRomanFont,
        color: rgb(0.17, 0.24, 0.31),
      });

      yPosition -= 40;

      // Signature
      coverPage.drawText('Sincerely,', {
        x: margin,
        y: yPosition,
        size: 11,
        font: timesRomanFont,
        color: rgb(0.17, 0.24, 0.31),
      });

      yPosition -= 30;

      coverPage.drawText(name, {
        x: margin,
        y: yPosition,
        size: 11,
        font: timesRomanBold,
        color: rgb(0.17, 0.24, 0.31),
      });
    }

    // Add Resume
    let resumePage = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - margin;

    // Resume Header
    const resumeTitleFontSize = 18;
    const resumeTitleWidth = helveticaBold.widthOfTextAtSize('Resume', resumeTitleFontSize);
    resumePage.drawText('Resume', {
      x: (pageWidth - resumeTitleWidth) / 2,
      y: yPosition,
      size: resumeTitleFontSize,
      font: helveticaBold,
      color: rgb(0.17, 0.24, 0.31),
    });

    // Underline
    yPosition -= 10;
    resumePage.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: pageWidth - margin, y: yPosition },
      thickness: 2,
      color: rgb(0.2, 0.59, 0.86),
    });

    yPosition -= 30;

    // Parse the resume content by sections
    const sections = resumeContent.split(/(?=^#{1,2}\s)/m).filter(section => section.trim());

    for (const section of sections) {
      const lines = section.split('\n').filter(line => line.trim());
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const pageCheck = checkNewPage(resumePage, yPosition);
        resumePage = pageCheck.page;
        yPosition = pageCheck.y;

        // Determine text styling based on markdown
        let font = timesRomanFont;
        let fontSize = 11;
        let color = rgb(0.17, 0.24, 0.31);
        let isHeader = false;
        let isBold = false;
        
        // Clean the line and determine styling
        let cleanLine = line;
        
        // Main headers (# )
        if (line.startsWith('# ')) {
          cleanLine = line.substring(2);
          font = helveticaBold;
          fontSize = 18;
          color = rgb(0.1, 0.1, 0.1);
          isHeader = true;
          
          // Add some space before main headers (except first one)
          if (yPosition < pageHeight - margin - 20) {
            yPosition -= 20;
            const pageCheck2 = checkNewPage(resumePage, yPosition);
            resumePage = pageCheck2.page;
            yPosition = pageCheck2.y;
          }
        }
        // Section headers (## )
        else if (line.startsWith('## ')) {
          cleanLine = line.substring(3);
          font = helveticaBold;
          fontSize = 14;
          color = rgb(0.2, 0.2, 0.2);
          isHeader = true;
          
          // Add space before section headers
          yPosition -= 10;
          const pageCheck3 = checkNewPage(resumePage, yPosition);
          resumePage = pageCheck3.page;
          yPosition = pageCheck3.y;
        }
        // Subsection headers (### )
        else if (line.startsWith('### ')) {
          cleanLine = line.substring(4);
          font = timesRomanBold;
          fontSize = 12;
          color = rgb(0.1, 0.1, 0.1);
          isBold = true;
          
          yPosition -= 5;
          const pageCheck4 = checkNewPage(resumePage, yPosition);
          resumePage = pageCheck4.page;
          yPosition = pageCheck4.y;
        }
        // Bold text (**text**)
        else if (line.includes('**')) {
          cleanLine = line.replace(/\*\*(.*?)\*\*/g, '$1');
          font = timesRomanBold;
          fontSize = 11;
          isBold = true;
        }
        // List items (- )
        else if (line.startsWith('- ')) {
          cleanLine = '• ' + line.substring(2);
          font = timesRomanFont;
          fontSize = 11;
        }
        // Email/phone/contact info
        else if (line.includes('@') || line.includes('Phone:') || line.includes('LinkedIn:')) {
          font = timesRomanFont;
          fontSize = 10;
          color = rgb(0.3, 0.3, 0.3);
        }

        // Wrap text if needed
        const wrappedLines = wrapText(cleanLine, font, fontSize, contentWidth);
        
        for (let j = 0; j < wrappedLines.length; j++) {
          const wrappedLine = wrappedLines[j];
          const pageCheck5 = checkNewPage(resumePage, yPosition);
          resumePage = pageCheck5.page;
          yPosition = pageCheck5.y;
          
          // Center main headers
          let xPosition = margin;
          if (isHeader && line.startsWith('# ')) {
            const textWidth = font.widthOfTextAtSize(wrappedLine, fontSize);
            xPosition = (pageWidth - textWidth) / 2;
          }
          
          resumePage.drawText(wrappedLine, {
            x: xPosition,
            y: yPosition,
            size: fontSize,
            font: font,
            color: color,
          });
          
          yPosition -= fontSize + 4;
        }

        // Add underline for main headers
        if (isHeader && line.startsWith('# ')) {
          yPosition -= 5;
          const pageCheck6 = checkNewPage(resumePage, yPosition);
          resumePage = pageCheck6.page;
          yPosition = pageCheck6.y;
          resumePage.drawLine({
            start: { x: margin, y: yPosition },
            end: { x: pageWidth - margin, y: yPosition },
            thickness: 1,
            color: rgb(0.2, 0.59, 0.86),
          });
          yPosition -= 15;
        }
        // Add space after section headers
        else if (isHeader && line.startsWith('## ')) {
          yPosition -= 8;
        }
        // Add space after subsection headers
        else if (isBold && line.startsWith('### ')) {
          yPosition -= 5;
        }
      }
      
      // Add space between sections
      yPosition -= 10;
    }

    // Generate safe filename
    const safeFileName = name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const filename = includeCoverLetter 
      ? `${safeFileName}_Complete_Application.pdf`
      : `${safeFileName}_Resume.pdf`;

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();

    console.log('Enhanced PDF generated successfully');

    // Return PDF
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBytes.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Enhanced PDF generation error:', error);
    
    return NextResponse.json({
      error: 'Error generating enhanced PDF',
      details: process.env.NODE_ENV === 'development' ? error.message : 'PDF generation failed'
    }, { status: 500 });
  }
}
