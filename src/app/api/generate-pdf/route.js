import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { content, token, jobDescription } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required for PDF download' },
        { status: 401 }
      );
    }

    // Generate dynamic cover letter based on job description
    let dynamicCoverLetter = '';
    if (jobDescription) {
      try {
        const coverLetterPrompt = `Create a personalized cover letter based on this resume content and job description. Make it unique, engaging, and tailored.

RESUME CONTENT:
${content}

JOB DESCRIPTION:
${jobDescription}

Create a professional cover letter that:
- Has a unique opening that grabs attention
- Specifically mentions the company/role from job description
- Highlights 2-3 most relevant experiences from the resume
- Shows enthusiasm for the specific role
- Has a strong closing with call to action
- Varies in length (3-5 paragraphs)
- Uses different tone/style based on company culture (formal for banks, casual for startups)

Format as clean text without markdown headers.`;

        const aiRes = await fetch("https://text.pollinations.ai/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: coverLetterPrompt }],
            model: "openai"
          }),
        });

        if (aiRes.ok) {
          dynamicCoverLetter = await aiRes.text();
        }
      } catch (error) {
        console.error('Cover letter generation error:', error);
      }
    }

    // Clean and format the markdown content
    function cleanAndFormatMarkdown(markdown) {
      // Split content into sections
      let cleanedContent = markdown;
      
      // Fix common formatting issues
      cleanedContent = cleanedContent
        // Fix email and contact info formatting
        .replace(/\*\*Email:\*\* ([^\|]+) \| \*\*Phone:\*\* ([^\|]+) \| \*\*LinkedIn:\*\*/g, 
                '**Email:** $1 | **Phone:** $2 | **LinkedIn:** [Profile Link]')
        // Fix section separators
        .replace(/---\s*## /g, '\n\n## ')
        .replace(/([a-z])\s*## /g, '$1\n\n## ')
        .replace(/([a-z])\s*### /g, '$1\n\n### ')
        // Fix bullet points
        .replace(/-\s*([^-\n]+)/g, '\n- $1')
        // Fix line breaks
        .replace(/\n{3,}/g, '\n\n')
        // Fix spacing around headers
        .replace(/([^\n])\n## /g, '$1\n\n## ')
        .replace(/([^\n])\n### /g, '$1\n\n### ');

      return cleanedContent;
    }

    // Convert markdown to HTML with proper formatting
    function markdownToHtml(markdown) {
      let html = markdown;
      
      // Convert markdown to HTML
      html = html
        // Headers
        .replace(/^### (.*$)/gim, '<h3 class="job-title">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="section-header">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="name">$1</h1>')
        
        // Bold text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        
        // Lists
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul class="bullet-list">$1</ul>')
        
        // Line breaks
        .replace(/\n/g, '<br>')
        
        // Fix nested lists
        .replace(/<ul class="bullet-list">\s*<br>\s*<li>/g, '<ul class="bullet-list"><li>')
        .replace(/<\/li>\s*<br>\s*<\/ul>/g, '</li></ul>')
        
        // Remove extra <br> tags
        .replace(/<br>\s*<br>/g, '</p><p>')
        .replace(/<br>\s*<h/g, '</p><h')
        .replace(/<br>\s*<ul/g, '</p><ul')
        
        // Wrap content in paragraphs
        .replace(/^([^<].*?)(?=<h|<ul|<br>|$)/gim, '<p class="content-paragraph">$1</p>')
        
        // Clean up empty paragraphs
        .replace(/<p class="content-paragraph"><\/p>/g, '')
        .replace(/<p class="content-paragraph"><br><\/p>/g, '');

      return html;
    }

    // Process the content
    const cleanedMarkdown = cleanAndFormatMarkdown(content);
    const resumeHtml = markdownToHtml(cleanedMarkdown);
    
    // Add cover letter section
    let coverLetterHtml = '<div class="page-break"></div>';
    coverLetterHtml += '<div class="cover-letter-section">';
    coverLetterHtml += '<h1 class="cover-letter-title">Cover Letter</h1>';
    
    if (dynamicCoverLetter && dynamicCoverLetter.trim()) {
      const coverLetterParagraphs = dynamicCoverLetter.split('\n\n');
      coverLetterParagraphs.forEach(paragraph => {
        if (paragraph.trim()) {
          coverLetterHtml += `<p class="letter-paragraph">${paragraph.trim()}</p>`;
        }
      });
    } else {
      // Fallback cover letter
      coverLetterHtml += '<p class="letter-paragraph">Dear Hiring Manager,</p>';
      coverLetterHtml += '<p class="letter-paragraph">I am writing to express my strong interest in this position. My background and experience make me a strong candidate for this role.</p>';
      coverLetterHtml += '<p class="letter-paragraph">I would welcome the opportunity to discuss how my skills and experience align with your needs.</p>';
      coverLetterHtml += '<p class="letter-paragraph">Best regards,<br>[Your Name]</p>';
    }
    
    coverLetterHtml += '</div>';
    
    const fullHtmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Professional Resume & Cover Letter</title>
          <style>
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            body { 
              font-family: 'Georgia', 'Times New Roman', serif; 
              line-height: 1.4; 
              color: #2c3e50; 
              background: white;
              font-size: 11pt;
              padding: 0;
            }
            
            .content {
              max-width: 8.5in;
              margin: 0 auto;
              padding: 0.75in;
              min-height: 11in;
            }
            
            /* Resume Header */
            .name {
              font-size: 28pt;
              font-weight: bold;
              color: #2c3e50;
              margin-bottom: 15pt;
              text-align: center;
              letter-spacing: 1pt;
              border-bottom: 2pt solid #3498db;
              padding-bottom: 10pt;
            }
            
            /* Section Headers */
            .section-header {
              font-size: 16pt;
              font-weight: bold;
              color: #34495e;
              margin: 20pt 0 10pt 0;
              padding-bottom: 5pt;
              border-bottom: 1pt solid #bdc3c7;
              page-break-after: avoid;
            }
            
            /* Job Titles */
            .job-title {
              font-size: 13pt;
              font-weight: bold;
              color: #2c3e50;
              margin: 12pt 0 4pt 0;
              page-break-after: avoid;
            }
            
            /* Content */
            .content-paragraph {
              margin: 8pt 0;
              line-height: 1.5;
              text-align: justify;
            }
            
            .bullet-list {
              margin: 8pt 0 12pt 20pt;
              padding: 0;
            }
            
            .bullet-list li {
              margin-bottom: 4pt;
              line-height: 1.4;
              list-style-type: disc;
            }
            
            strong {
              font-weight: bold;
              color: #2c3e50;
            }
            
            /* Cover Letter Styles */
            .page-break {
              page-break-before: always;
              height: 0;
            }
            
            .cover-letter-section {
              margin-top: 0;
            }
            
            .cover-letter-title {
              font-size: 22pt;
              font-weight: bold;
              color: #2c3e50;
              text-align: center;
              margin-bottom: 25pt;
              padding-bottom: 10pt;
              border-bottom: 2pt solid #3498db;
            }
            
            .letter-paragraph {
              margin: 12pt 0;
              line-height: 1.6;
              text-align: justify;
              text-indent: 0;
            }
            
            /* Print Optimizations */
            @media print {
              body {
                font-size: 10pt;
              }
              
              .content {
                padding: 0.5in;
              }
              
              .name {
                font-size: 24pt;
              }
              
              .section-header {
                font-size: 14pt;
              }
              
              .job-title {
                font-size: 11pt;
              }
              
              .cover-letter-title {
                font-size: 18pt;
              }
              
              /* Ensure proper page breaks */
              .job-title,
              .section-header {
                page-break-after: avoid;
              }
              
              .bullet-list {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="content">
            ${resumeHtml}
            ${coverLetterHtml}
          </div>
        </body>
      </html>
    `;

    return NextResponse.json({
      success: true,
      htmlContent: fullHtmlContent,
      message: 'PDF content generated successfully'
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Error generating PDF' },
      { status: 500 }
    );
  }
}