import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request) {
  let browser = null;
  try {
    // Parse request body
    const body = await request.json();
    const jobDescription = body.jobDescription || body.coverLetter || '';

    // Validate input
    if (!jobDescription) {
      return NextResponse.json(
        { error: 'Job description or cover letter text is required' },
        { status: 400 }
      );
    }

    // Extract name for title (fallback to Hariharan R if not provided)
    const nameMatch = body.content ? body.content.match(/^#\s*(.+)$/m) : ['sample'].match(/^#\s*(.+)$/m);
    const documentTitle = `${nameMatch[1]}'s Cover Letter`;

    // Generate dynamic cover letter
    let dynamicCoverLetter = '';
    try {
      const coverLetterPrompt = `Create a personalized cover letter for Hariharan R based on this job description. Make it unique, engaging, and tailored.\n\nJOB DESCRIPTION:\n${jobDescription}\n\nCreate a professional cover letter that:\n- Has a unique opening that grabs attention\n- Specifically mentions the company/role from job description\n- Highlights 2-3 relevant experiences from Hariharan R's background: freelance MERN stack projects (Chill-Chat and Aura apps with real-time features, media sharing, JWT authentication, MongoDB/MySQL, deployed on Render/Vercel), and Node.js/Express internship at XYZ Technologies (building backend services, reducing latency by 20%, API security)\n- Shows enthusiasm for the specific role\n- Has a strong closing with call to action\n- Varies in length (3-5 paragraphs)\n- Uses different tone/style based on company culture (formal for banks, casual for startups)\n- End with Sincerely, Hariharan R\n\nFormat as clean text without markdown headers or placeholders like [Company Name] or [Full Name]. Use actual names and details.`;
      const aiRes = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: coverLetterPrompt }],
          model: 'openai',
        }),
      });
      if (aiRes.ok) {
        dynamicCoverLetter = await aiRes.text();
      }
    } catch (error) {
      console.error('Cover letter generation error:', error);
    }
//     // Fallback if API fails (no placeholders)
//     if (!dynamicCoverLetter) {
//       dynamicCoverLetter = `Dear Hiring Team at CodeCrafters Labs,

// Imagine a backend developer who doesn't just write code but crafts resilient, scalable engines that power seamless user experiences—that’s exactly the kind of energy I’m excited to bring to your team as a Backend Developer. Reading through your job description, I immediately saw a lot of synergy with my experience and passion, especially given your focus on Node.js and Express, building robust APIs, and optimizing system performance. I’d love to contribute to your innovative projects and help elevate your backend architecture to new heights.

// In my recent freelance projects, I developed two full-featured web applications, Chill-Chat and Aura, utilizing the MERN stack. These applications supported over 50 concurrent users, with real-time media sharing and secure authentication through JWT. My hands-on experience with designing RESTful APIs and managing database schemas in MongoDB and MySQL aligns closely with your needs for creating efficient backend systems. Deploying these on cloud platforms like Render and Vercel, I ensured high availability and smooth deployment workflows, which echoes your emphasis on scalable and reliable solutions.

// Additionally, during my internship at XYZ Technologies, I contributed to building backend services with Node.js and Express, focusing on reducing API latency and enhancing security. Collaborating with frontend developers, I learned the importance of clean, reusable server-side code—values I hold dearly and practice with every project. My familiarity with Git workflows and debugging complements your requirements for a problem-solver who thrives in team environments.

// What excites me most about joining CodeCrafters Labs is your commitment to innovation and flexible remote work. I am eager to bring my enthusiasm for backend engineering, along with my technical skills and proactive mindset, to develop solutions that not only meet functional needs but also anticipate future scalability and security challenges. I am confident that my background and drive will be a valuable addition to your team.

// I’d love the opportunity to discuss how my experience can align with your vision. Please feel free to reach out for a chat—I look forward to the possibility of contributing to CodeCrafters Labs’ exciting journey.

// Sincerely,
// Hariharan R`;
//     }

    // Generate cover letter HTML
    let coverLetterHtml = '<div class="cover-letter-section">';
    coverLetterHtml += '<h1 class="cover-letter-title">Cover Letter</h1>';
    coverLetterHtml += '<p class="date">August 17, 2025</p>';
    const coverLetterParagraphs = dynamicCoverLetter.split('\n\n');
    coverLetterParagraphs.forEach(paragraph => {
      if (paragraph.trim()) {
        coverLetterHtml += `<p class="letter-paragraph">${paragraph.trim()}</p>`;
      }
    });
    coverLetterHtml += '<p class="closing">Sincerely,<br>Hariharan R</p>';
    coverLetterHtml += '</div>';

    // Single page allocation (no empty pages)
    const pagesHtml = [coverLetterHtml];

    // Combine pages with page breaks (only if multiple pages needed, but filtered)
    const fullHtmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${documentTitle}</title>
          <style>
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Georgia', 'Times New Roman', Times, serif;
              line-height: 1.6;
              color: #2c3e50;
              background: white;
              font-size: 11pt;
              padding: 0;
            }
            .content {
              width: 595pt; /* A4 width */
              margin: 0 auto;
              padding: 50pt;
              /* No min-height to avoid forcing empty pages */
            }
            .cover-letter-section {
              margin-top: 0;
            }
            .cover-letter-title {
              font-size: 20pt;
              font-weight: bold;
              color: #2c3e50;
              text-align: center;
              margin-bottom: 20pt;
              padding-bottom: 10pt;
              border-bottom: 2pt solid #3498db;
            }
            .date {
              text-align: right;
              margin-bottom: 20pt;
            }
            .letter-paragraph {
              margin: 12pt 0;
              line-height: 1.6;
              text-align: left;
              text-indent: 20pt;
            }
            .closing {
              margin-top: 20pt;
              text-align: right;
              font-style: italic;
            }
            @media print {
              body {
                font-size: 10pt;
                margin: 0;
              }
              .content {
                padding: 40pt;
                width: 595pt;
              }
              .cover-letter-title {
                font-size: 18pt;
              }
              .letter-paragraph {
                text-indent: 15pt;
              }
              .closing {
                text-align: right;
              }
            }
          </style>
        </head>
        <body>
          <div class="content">
            ${pagesHtml.join('')}
          </div>
        </body>
      </html>
    `;

    // Puppeteer PDF generation
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: 'new',
    });
    const page = await browser.newPage();
    await page.setContent(fullHtmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      },
    });
    await browser.close();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${documentTitle.replace(/[^a-zA-Z0-9 ]/g, '')}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    if (browser) {
      await browser.close().catch(err => console.error('Browser close error:', err));
    }
    return NextResponse.json(
      { error: 'Error generating PDF' },
      { status: 500 }
    );
  }
}