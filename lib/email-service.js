import nodemailer from 'nodemailer';

// Email service configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
};

// Base email template
const getBaseTemplate = (content, title = 'RoleFitAI') => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          padding: 40px;
          color: white;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          background: linear-gradient(45deg, #ffd700, #ffed4e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 10px;
        }
        .content {
          background: rgba(255,255,255,0.1);
          border-radius: 15px;
          padding: 30px;
          margin: 20px 0;
          backdrop-filter: blur(10px);
        }
        .button {
          display: inline-block;
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 50px;
          font-weight: bold;
          margin: 20px 0;
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
          transition: transform 0.3s ease;
        }
        .button:hover {
          transform: translateY(-2px);
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 14px;
          opacity: 0.8;
        }
        .social-links {
          margin: 20px 0;
        }
        .social-links a {
          color: #ffd700;
          text-decoration: none;
          margin: 0 10px;
        }
        .stats {
          display: flex;
          justify-content: space-around;
          margin: 20px 0;
          text-align: center;
        }
        .stat {
          flex: 1;
        }
        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: #ffd700;
        }
        .stat-label {
          font-size: 12px;
          opacity: 0.8;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🚀 RoleFitAI</div>
          <p>AI-Powered Career Transformation</p>
        </div>
        
        ${content}
        
        <div class="footer">
          <div class="stats">
            <div class="stat">
              <div class="stat-number">10K+</div>
              <div class="stat-label">Resumes Enhanced</div>
            </div>
            <div class="stat">
              <div class="stat-number">95%</div>
              <div class="stat-label">ATS Pass Rate</div>
            </div>
            <div class="stat">
              <div class="stat-number">4.9★</div>
              <div class="stat-label">User Rating</div>
            </div>
          </div>
          
          <div class="social-links">
            <a href="https://rolefitai.vercel.app/">Visit Website</a> |
            <a href="https://rolefitai.vercel.app/contact">Contact Support</a> |
            <a href="https://rolefitai.vercel.app/privacy">Privacy Policy</a>
          </div>
          
          <p>© 2024 RoleFitAI. All rights reserved.</p>
          <p style="font-size: 12px; opacity: 0.6;">
            You're receiving this email because you have an account with RoleFitAI.
            <br>
            <a href="https://rolefitai.vercel.app/unsubscribe" style="color: #ffd700;">Unsubscribe</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Email templates
export const emailTemplates = {
  welcome: (userName, userEmail) => ({
    subject: '🎉 Welcome to RoleFitAI - Your AI Career Assistant!',
    html: getBaseTemplate(`
      <div class="content">
        <h2>Welcome aboard, ${userName}! 🚀</h2>
        <p>We're thrilled to have you join the RoleFitAI community! You've just taken the first step towards transforming your career with the power of AI.</p>
        
        <h3>🌟 What you can do now:</h3>
        <ul>
          <li>✅ Upload your resume for instant AI optimization</li>
          <li>✅ Generate ATS-friendly cover letters</li>
          <li>✅ Get personalized job recommendations</li>
          <li>✅ Track your application success rate</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://rolefitai.vercel.app/dashboard" class="button">
            Start Building Your Perfect Resume 🎯
          </a>
        </div>
        
        <div style="background: rgba(255,215,0,0.1); padding: 20px; border-radius: 10px; border-left: 4px solid #ffd700;">
          <h4>💡 Pro Tip:</h4>
          <p>Upload your current resume first, then use our AI enhancement feature to optimize it for specific job descriptions. This can increase your interview chances by up to 300%!</p>
        </div>
      </div>
    `, `Welcome to RoleFitAI - ${userName}`)
  }),

  resumeEnhanced: (userName, jobTitle, companyName) => ({
    subject: `✨ Your resume has been enhanced for ${jobTitle} at ${companyName}!`,
    html: getBaseTemplate(`
      <div class="content">
        <h2>Great news, ${userName}! 🎉</h2>
        <p>Your resume has been successfully enhanced and optimized for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
        
        <div style="background: rgba(34,197,94,0.1); padding: 20px; border-radius: 10px; border-left: 4px solid #22c55e; margin: 20px 0;">
          <h3>🎯 Enhancement Results:</h3>
          <ul>
            <li>✅ ATS compatibility improved to 95%+</li>
            <li>✅ Keywords optimized for job requirements</li>
            <li>✅ Skills section aligned with job description</li>
            <li>✅ Experience highlights tailored to role</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://rolefitai.vercel.app/dashboard" class="button">
            Download Your Enhanced Resume 📄
          </a>
        </div>
        
        <h3>🚀 Next Steps:</h3>
        <ol>
          <li>Review your enhanced resume</li>
          <li>Generate a matching cover letter</li>
          <li>Apply with confidence!</li>
        </ol>
        
        <p style="margin-top: 30px; font-style: italic; opacity: 0.9;">
          "The best resumes don't just list experience—they tell a compelling story that matches what employers are looking for." - RoleFitAI Team
        </p>
      </div>
    `, `Resume Enhanced - ${userName}`)
  }),

  jobMatch: (userName, jobsCount, topJob) => ({
    subject: `🎯 ${jobsCount} new job matches found for you!`,
    html: getBaseTemplate(`
      <div class="content">
        <h2>Exciting opportunities await, ${userName}! 🌟</h2>
        <p>Our AI has found <strong>${jobsCount} new job opportunities</strong> that perfectly match your skills and experience.</p>
        
        ${topJob ? `
        <div style="background: rgba(59,130,246,0.1); padding: 20px; border-radius: 10px; border-left: 4px solid #3b82f6; margin: 20px 0;">
          <h3>🏆 Top Match:</h3>
          <h4>${topJob.title}</h4>
          <p><strong>${topJob.company}</strong> • ${topJob.location}</p>
          <p>Match Score: <span style="color: #22c55e; font-weight: bold;">${topJob.matchScore}%</span></p>
          <p>${topJob.description}</p>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://rolefitai.vercel.app/jobs" class="button">
            View All Job Matches 🔍
          </a>
        </div>
        
        <h3>💼 Why these jobs are perfect for you:</h3>
        <ul>
          <li>Skills alignment with your expertise</li>
          <li>Salary range matches your expectations</li>
          <li>Company culture fits your preferences</li>
          <li>Career growth opportunities</li>
        </ul>
        
        <div style="background: rgba(255,215,0,0.1); padding: 20px; border-radius: 10px; border-left: 4px solid #ffd700; margin-top: 30px;">
          <h4>⚡ Quick Apply Tip:</h4>
          <p>Use our cover letter generator to create personalized cover letters for each application. This increases your response rate by 250%!</p>
        </div>
      </div>
    `, `New Job Matches - ${userName}`)
  }),

  weeklyDigest: (userName, stats) => ({
    subject: '📊 Your Weekly Career Progress Report',
    html: getBaseTemplate(`
      <div class="content">
        <h2>Your week in review, ${userName}! 📈</h2>
        <p>Here's a summary of your career development activities this week.</p>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0;">
          <div style="background: rgba(59,130,246,0.1); padding: 20px; border-radius: 10px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #3b82f6;">${stats.resumesEnhanced || 0}</div>
            <div>Resumes Enhanced</div>
          </div>
          <div style="background: rgba(34,197,94,0.1); padding: 20px; border-radius: 10px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #22c55e;">${stats.jobsApplied || 0}</div>
            <div>Jobs Applied</div>
          </div>
          <div style="background: rgba(168,85,247,0.1); padding: 20px; border-radius: 10px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #a855f7;">${stats.coverLetters || 0}</div>
            <div>Cover Letters</div>
          </div>
          <div style="background: rgba(245,158,11,0.1); padding: 20px; border-radius: 10px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${stats.profileViews || 0}</div>
            <div>Profile Views</div>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://rolefitai.vercel.app/dashboard" class="button">
            Continue Your Journey 🚀
          </a>
        </div>
        
        <h3>🎯 This Week's Achievements:</h3>
        <ul>
          <li>✅ Maintained consistent job search activity</li>
          <li>✅ Optimized resume for better ATS compatibility</li>
          <li>✅ Expanded professional network</li>
        </ul>
        
        <div style="background: rgba(255,215,0,0.1); padding: 20px; border-radius: 10px; border-left: 4px solid #ffd700; margin-top: 30px;">
          <h4>💡 Next Week's Goal:</h4>
          <p>Focus on applying to 3-5 high-quality positions and following up on previous applications. Quality over quantity always wins!</p>
        </div>
      </div>
    `, `Weekly Progress - ${userName}`)
  }),

  applicationReminder: (userName, jobTitle, companyName, daysAgo) => ({
    subject: `⏰ Follow up on your ${jobTitle} application at ${companyName}`,
    html: getBaseTemplate(`
      <div class="content">
        <h2>Time for a follow-up, ${userName}! 📞</h2>
        <p>It's been ${daysAgo} days since you applied for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
        
        <div style="background: rgba(59,130,246,0.1); padding: 20px; border-radius: 10px; border-left: 4px solid #3b82f6; margin: 20px 0;">
          <h3>📋 Application Details:</h3>
          <p><strong>Position:</strong> ${jobTitle}</p>
          <p><strong>Company:</strong> ${companyName}</p>
          <p><strong>Applied:</strong> ${daysAgo} days ago</p>
          <p><strong>Status:</strong> Awaiting response</p>
        </div>
        
        <h3>✉️ Follow-up Email Template:</h3>
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; font-family: monospace; font-size: 14px;">
          <p>Subject: Following up on ${jobTitle} Application</p>
          <br>
          <p>Dear Hiring Manager,</p>
          <br>
          <p>I hope this email finds you well. I wanted to follow up on my application for the ${jobTitle} position that I submitted ${daysAgo} days ago.</p>
          <br>
          <p>I remain very interested in this opportunity and would welcome the chance to discuss how my skills and experience align with your team's needs.</p>
          <br>
          <p>Thank you for your time and consideration.</p>
          <br>
          <p>Best regards,<br>${userName}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://rolefitai.vercel.app/dashboard" class="button">
            Track All Applications 📊
          </a>
        </div>
        
        <div style="background: rgba(34,197,94,0.1); padding: 20px; border-radius: 10px; border-left: 4px solid #22c55e; margin-top: 30px;">
          <h4>💡 Pro Tip:</h4>
          <p>Following up shows initiative and genuine interest. Companies appreciate candidates who demonstrate persistence and professionalism!</p>
        </div>
      </div>
    `, `Follow-up Reminder - ${userName}`)
  })
};

// Main email sending function
export const sendEmail = async (to, template, templateData) => {
  try {
    const transporter = createTransporter();
    const emailContent = emailTemplates[template](templateData.userName, ...Object.values(templateData).slice(1));
    
    const mailOptions = {
      from: `"RoleFitAI Team" <${process.env.EMAIL_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Bulk email sending for notifications
export const sendBulkEmails = async (recipients, template, templateData) => {
  const results = [];
  
  for (const recipient of recipients) {
    try {
      const result = await sendEmail(recipient.email, template, {
        ...templateData,
        userName: recipient.name
      });
      results.push({ email: recipient.email, ...result });
    } catch (error) {
      results.push({ email: recipient.email, success: false, error: error.message });
    }
  }
  
  return results;
};

// Email verification
export const sendVerificationEmail = async (email, verificationToken, userName) => {
  const verificationUrl = `https://rolefitai.vercel.app/verify-email?token=${verificationToken}`;
  
  const template = getBaseTemplate(`
    <div class="content">
      <h2>Verify your email address, ${userName}! 📧</h2>
      <p>Thanks for signing up with RoleFitAI! To complete your registration and start building amazing resumes, please verify your email address.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" class="button">
          Verify Email Address ✅
        </a>
      </div>
      
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; background: rgba(255,255,255,0.1); padding: 10px; border-radius: 5px;">
        ${verificationUrl}
      </p>
      
      <div style="background: rgba(239,68,68,0.1); padding: 20px; border-radius: 10px; border-left: 4px solid #ef4444; margin-top: 30px;">
        <h4>⚠️ Important:</h4>
        <p>This verification link will expire in 24 hours. If you didn't create an account with RoleFitAI, you can safely ignore this email.</p>
      </div>
    </div>
  `, `Verify Your Email - ${userName}`);

  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"RoleFitAI Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Verify your RoleFitAI account',
      html: template,
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Verification email failed:', error);
    return { success: false, error: error.message };
  }
};

export default { sendEmail, sendBulkEmails, sendVerificationEmail, emailTemplates };
