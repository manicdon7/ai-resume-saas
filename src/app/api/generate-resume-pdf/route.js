import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function POST(request) {
  try {
    const body = await request.json();
    const resumeContent = body.content;
    const name = body.name || 'Resume';

    if (!resumeContent) {
      return NextResponse.json(
        { error: 'Resume content is required' },
        { status: 400 }
      );
    }

    // Create PDF using pdf-lib
    console.log('Creating resume PDF with pdf-lib...');
    
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

    // Function to add new page if needed
    let currentPage = page;
    function checkNewPage() {
      if (yPosition < margin + 50) {
        currentPage = pdfDoc.addPage([612, 792]);
        yPosition = height - margin;
        return currentPage;
      }
      return currentPage;
    }

    // Parse the resume content by sections
    const sections = resumeContent.split(/(?=^#{1,2}\s)/m).filter(section => section.trim());

    for (const section of sections) {
      const lines = section.split('\n').filter(line => line.trim());
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        currentPage = checkNewPage();

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
          if (yPosition < height - margin - 20) {
            yPosition -= 20;
            currentPage = checkNewPage();
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
          currentPage = checkNewPage();
        }
        // Subsection headers (### )
        else if (line.startsWith('### ')) {
          cleanLine = line.substring(4);
          font = timesRomanBold;
          fontSize = 12;
          color = rgb(0.1, 0.1, 0.1);
          isBold = true;
          
          yPosition -= 5;
          currentPage = checkNewPage();
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
          currentPage = checkNewPage();
          
          // Center main headers
          let xPosition = margin;
          if (isHeader && line.startsWith('# ')) {
            const textWidth = font.widthOfTextAtSize(wrappedLine, fontSize);
            xPosition = (width - textWidth) / 2;
          }
          
          currentPage.drawText(wrappedLine, {
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
          currentPage = checkNewPage();
          currentPage.drawLine({
            start: { x: margin, y: yPosition },
            end: { x: width - margin, y: yPosition },
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

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();

    console.log('Resume PDF generated successfully with pdf-lib');

    // Return PDF
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFileName}_Enhanced_Resume.pdf"`,
        'Content-Length': pdfBytes.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Resume PDF generation error:', error);
    
    return NextResponse.json({
      error: 'Error generating resume PDF',
      details: process.env.NODE_ENV === 'development' ? error.message : 'PDF generation failed'
    }, { status: 500 });
  }
}
