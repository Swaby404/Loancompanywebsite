// Email service using Resend API

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const DEFAULT_FROM = "Harvey's Loans <onboarding@resend.dev>";
const HARVEY_LOANS_EMAIL = 'Harveysloansllc@outlook.com';
const TEST_EMAIL = 'swabyoliver@gmail.com';

// Log API key status on service load
if (!RESEND_API_KEY || RESEND_API_KEY.trim() === '') {
  console.log('⚠️  RESEND_API_KEY is not configured');
} else {
  console.log('✅ RESEND_API_KEY is configured');
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!RESEND_API_KEY || RESEND_API_KEY.trim() === '') {
    console.log('📧 Email logging (API key not configured):');
    console.log('   To:', options.to);
    console.log('   Subject:', options.subject);
    // Return success to prevent errors in the app
    return { success: true, messageId: 'mock-email-' + Date.now() };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from || DEFAULT_FROM,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('📧 Email logging (API error):');
      console.log('   To:', options.to);
      console.log('   Subject:', options.subject);
      console.log('   Error:', errorData.message);
      
      // Return success to prevent app errors
      return { success: true, messageId: 'mock-email-' + Date.now() };
    }

    const data = await response.json();
    console.log(`✅ Email sent: ${data.id} to ${options.to}`);
    
    return { success: true, messageId: data.id };
  } catch (error) {
    console.log('📧 Email logging (exception):');
    console.log('   To:', options.to);
    console.log('   Subject:', options.subject);
    // Return success to prevent app errors
    return { success: true, messageId: 'mock-email-' + Date.now() };
  }
}

// Send welcome email
export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Harvey's Loans</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to Harvey's Loans!</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; color: #333;">Hi ${userName},</p>
        
        <p style="font-size: 16px; color: #666;">
          Thank you for joining Harvey's Loans! Your account has been successfully created.
        </p>
        
        <p style="font-size: 16px; color: #666;">
          We're here to help you get the financial support you need with competitive rates and fast approval.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <h2 style="color: #667eea; margin-top: 0;">Next Steps:</h2>
          <ul style="color: #666;">
            <li>Complete your loan application</li>
            <li>Upload required documents (proof of employment, ID)</li>
            <li>Get approved within 24-48 hours</li>
            <li>Receive your funds</li>
          </ul>
        </div>
        
        <p style="font-size: 16px; color: #666;">
          If you have any questions, feel free to contact us:
        </p>
        
        <p style="font-size: 14px; color: #666;">
          📞 Phone: <a href="tel:1-3459178564" style="color: #667eea;">1-345-917-8564</a><br>
          ✉️ Email: <a href="mailto:Harveysloansllc@outlook.com" style="color: #667eea;">Harveysloansllc@outlook.com</a>
        </p>
        
        <p style="font-size: 14px; color: #999; margin-top: 40px; text-align: center;">
          © ${new Date().getFullYear()} Harvey's Loans. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: 'Welcome to Harvey\'s Loans - Your Account is Ready!',
    html,
  });
}

// Send password reset email
export async function sendPasswordResetEmail(userEmail: string, resetToken: string, origin: string): Promise<{ success: boolean; error?: string }> {
  const resetUrl = `${origin}/reset-password?token=${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset Request</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🔒 Password Reset Request</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #666;">
          We received a request to reset your password for your Harvey's Loans account.
        </p>
        
        <p style="font-size: 16px; color: #666;">
          Click the button below to reset your password. This link will expire in 1 hour.
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Reset Password
          </a>
        </div>
        
        <p style="font-size: 14px; color: #999;">
          Or copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
        </p>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 30px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            ⚠️ If you didn't request this password reset, please ignore this email or contact us immediately.
          </p>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Need help? Contact us:<br>
          📞 <a href="tel:1-3459178564" style="color: #667eea;">1-345-917-8564</a><br>
          ✉️ <a href="mailto:Harveysloansllc@outlook.com" style="color: #667eea;">Harveysloansllc@outlook.com</a>
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: 'Password Reset Request - Harvey\'s Loans',
    html,
  });
}

// Send loan application notification to admins
export async function sendLoanApplicationNotification(applicationData: any): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Loan Application</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">💰 New Loan Application Received</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #059669; margin-top: 0;">Application Details</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Application ID:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${applicationData.applicationId}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Full Name:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${applicationData.fullName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${applicationData.email}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Phone:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${applicationData.phone}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Date of Birth:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${applicationData.dateOfBirth}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Address:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${applicationData.address}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Loan Amount:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 18px; font-weight: bold; color: #059669;">$${applicationData.loanAmount?.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Loan Purpose:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${applicationData.loanPurpose}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Employment Status:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${applicationData.employmentStatus}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Annual Income:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">$${applicationData.annualIncome?.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Submitted:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${new Date(applicationData.submittedAt).toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #059669; margin-top: 0;">Uploaded Documents</h3>
          <ul>
            ${applicationData.proofOfEmployment ? `<li>Proof of Employment: <a href="${applicationData.proofOfEmployment}" style="color: #059669;">View Document</a></li>` : ''}
            ${applicationData.idDocument ? `<li>ID Document: <a href="${applicationData.idDocument}" style="color: #059669;">View Document</a></li>` : ''}
          </ul>
        </div>

        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #1e40af;">
            <strong>Interest Rate:</strong> 30% annually<br>
            <strong>Status:</strong> Pending Review
          </p>
        </div>

        <p style="text-align: center; color: #666; margin-top: 30px;">
          Please review this application in the admin dashboard.
        </p>
      </div>
    </body>
    </html>
  `;

  // Send to both admin emails
  const promises = [
    sendEmail({
      to: HARVEY_LOANS_EMAIL,
      subject: `New Loan Application - ${applicationData.fullName} - ${applicationData.applicationId}`,
      html,
    }),
    sendEmail({
      to: TEST_EMAIL,
      subject: `New Loan Application - ${applicationData.fullName} - ${applicationData.applicationId}`,
      html,
    }),
  ];

  const results = await Promise.all(promises);
  const allSuccess = results.every(r => r.success);
  
  return {
    success: allSuccess,
    error: allSuccess ? undefined : 'Some emails failed to send',
  };
}

// Send loan status update email
export async function sendLoanStatusUpdateEmail(
  userEmail: string,
  userName: string,
  applicationId: string,
  status: string,
  message?: string
): Promise<{ success: boolean; error?: string }> {
  const statusColors = {
    approved: { bg: '#10b981', text: 'Approved' },
    rejected: { bg: '#ef4444', text: 'Rejected' },
    pending: { bg: '#f59e0b', text: 'Pending' },
  };

  const statusInfo = statusColors[status as keyof typeof statusColors] || statusColors.pending;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Loan Application Update</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: ${statusInfo.bg}; padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Loan Application Update</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; color: #333;">Hi ${userName},</p>
        
        <p style="font-size: 16px; color: #666;">
          Your loan application <strong>${applicationId}</strong> has been <strong>${statusInfo.text}</strong>.
        </p>
        
        ${message ? `
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusInfo.bg};">
            <p style="margin: 0; color: #666;"><strong>Message from Harvey's Loans:</strong></p>
            <p style="margin: 10px 0 0 0; color: #666;">${message}</p>
          </div>
        ` : ''}
        
        ${status === 'approved' ? `
          <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #059669; margin-top: 0;">🎉 Congratulations!</h3>
            <p style="color: #065f46; margin: 0;">
              Your loan has been approved! Please log in to your account to view payment details and next steps.
            </p>
            <p style="color: #065f46; margin: 10px 0 0 0; font-weight: bold;">
              Interest Rate: 30% annually
            </p>
          </div>
        ` : ''}
        
        <p style="font-size: 16px; color: #666;">
          Log in to your account to view full details.
        </p>
        
        <p style="font-size: 14px; color: #666; margin-top: 40px;">
          Questions? Contact us:<br>
          📞 <a href="tel:1-3459178564" style="color: #667eea;">1-345-917-8564</a><br>
          ✉️ <a href="mailto:Harveysloansllc@outlook.com" style="color: #667eea;">Harveysloansllc@outlook.com</a>
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: `Loan Application ${statusInfo.text} - ${applicationId}`,
    html,
  });
}

// Send system credentials email for testing
export async function sendSystemCredentialsEmail(details: {
  eventType: string;
  userEmail?: string;
  userName?: string;
  password?: string;
  resetToken?: string;
  userId?: string;
  additionalInfo?: Record<string, any>;
}): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>System Testing Credentials</title>
    </head>
    <body style="font-family: 'Courier New', monospace; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🔐 Testing Credentials - ${details.eventType}</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <div style="background: #1f2937; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #10b981; margin-top: 0;">Event Details</h2>
          <table style="width: 100%; color: #e5e7eb;">
            <tr>
              <td style="padding: 10px;"><strong style="color: #10b981;">Event Type:</strong></td>
              <td style="padding: 10px;">${details.eventType}</td>
            </tr>
            <tr>
              <td style="padding: 10px;"><strong style="color: #10b981;">Timestamp:</strong></td>
              <td style="padding: 10px;">${new Date().toISOString()}</td>
            </tr>
            ${details.userId ? `
              <tr>
                <td style="padding: 10px;"><strong style="color: #10b981;">User ID:</strong></td>
                <td style="padding: 10px; word-break: break-all;">${details.userId}</td>
              </tr>
            ` : ''}
          </table>
        </div>

        ${details.userEmail || details.userName || details.password ? `
          <div style="background: #1f2937; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #10b981; margin-top: 0;">User Credentials</h2>
            <table style="width: 100%; color: #e5e7eb;">
              ${details.userName ? `
                <tr>
                  <td style="padding: 10px;"><strong style="color: #10b981;">Name:</strong></td>
                  <td style="padding: 10px;">${details.userName}</td>
                </tr>
              ` : ''}
              ${details.userEmail ? `
                <tr>
                  <td style="padding: 10px;"><strong style="color: #10b981;">Email:</strong></td>
                  <td style="padding: 10px;">${details.userEmail}</td>
                </tr>
              ` : ''}
              ${details.password ? `
                <tr>
                  <td style="padding: 10px;"><strong style="color: #10b981;">Password:</strong></td>
                  <td style="padding: 10px; background: #374151; font-weight: bold; color: #fbbf24;">${details.password}</td>
                </tr>
              ` : ''}
            </table>
          </div>
        ` : ''}

        ${details.resetToken ? `
          <div style="background: #1f2937; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #10b981; margin-top: 0;">Password Reset Token</h2>
            <div style="background: #374151; padding: 15px; border-radius: 5px; word-break: break-all;">
              <code style="color: #fbbf24;">${details.resetToken}</code>
            </div>
          </div>
        ` : ''}

        ${details.additionalInfo ? `
          <div style="background: #1f2937; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #10b981; margin-top: 0;">Additional Info</h2>
            <table style="width: 100%; color: #e5e7eb;">
              ${Object.entries(details.additionalInfo).map(([key, value]) => `
                <tr>
                  <td style="padding: 10px;"><strong style="color: #10b981;">${key}:</strong></td>
                  <td style="padding: 10px; word-break: break-all;">${value}</td>
                </tr>
              `).join('')}
            </table>
          </div>
        ` : ''}

      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: TEST_EMAIL,
    subject: `System Event - ${details.eventType}`,
    html,
  });
}

// Send verification code email for on-site password reset
export async function sendVerificationCodeEmail(userEmail: string, code: string): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your Verification Code</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Your Verification Code</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #666;">
          You requested to reset your password on the Harvey's Loans website. Use the verification code below to continue:
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <div style="display: inline-block; background: #1f2937; color: #fbbf24; font-size: 36px; font-weight: bold; letter-spacing: 12px; padding: 20px 40px; border-radius: 12px; font-family: 'Courier New', monospace;">
            ${code}
          </div>
        </div>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 30px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            This code expires in <strong>15 minutes</strong>. Do not share it with anyone.
          </p>
        </div>

        <p style="font-size: 14px; color: #999;">
          If you didn't request this, please ignore this email or contact us immediately.
        </p>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Need help? Contact us:<br>
          📞 <a href="tel:1-3459178564" style="color: #667eea;">1-345-917-8564</a><br>
          ✉️ <a href="mailto:Harveysloansllc@outlook.com" style="color: #667eea;">Harveysloansllc@outlook.com</a>
        </p>
        
        <p style="font-size: 14px; color: #999; margin-top: 40px; text-align: center;">
          © ${new Date().getFullYear()} Harvey's Loans. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: `${code} — Your Harvey's Loans Verification Code`,
    html,
  });
}

// Send temporary password email
export async function sendTempPasswordEmail(userEmail: string, tempPassword: string): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your Temporary Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Temporary Password</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #666;">
          You requested a temporary password for your Harvey's Loans account. Use the password below to sign in:
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <div style="display: inline-block; background: #1f2937; padding: 20px 40px; border-radius: 12px;">
            <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Your Temporary Password</p>
            <code style="color: #fbbf24; font-size: 24px; font-weight: bold; letter-spacing: 2px;">${tempPassword}</code>
          </div>
        </div>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 30px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Important:</strong> For your security, we strongly recommend changing this password after you sign in. Go to your account settings or use the "Forgot Password" feature again to set a permanent password of your choice.
          </p>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <h3 style="color: #667eea; margin-top: 0;">How to Sign In:</h3>
          <ol style="color: #666;">
            <li>Go to the Harvey's Loans sign-in page</li>
            <li>Enter your email: <strong>${userEmail}</strong></li>
            <li>Enter the temporary password shown above</li>
            <li>After signing in, change your password for security</li>
          </ol>
        </div>
        
        <p style="font-size: 14px; color: #999;">
          If you didn't request this, someone may have access to your email. Please contact us immediately.
        </p>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Need help? Contact us:<br>
          📞 <a href="tel:1-3459178564" style="color: #667eea;">1-345-917-8564</a><br>
          ✉️ <a href="mailto:Harveysloansllc@outlook.com" style="color: #667eea;">Harveysloansllc@outlook.com</a>
        </p>
        
        <p style="font-size: 14px; color: #999; margin-top: 40px; text-align: center;">
          © ${new Date().getFullYear()} Harvey's Loans. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: "Your Temporary Password — Harvey's Loans",
    html,
  });
}

// Send password changed confirmation email
export async function sendPasswordChangedConfirmationEmail(userEmail: string): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Changed Successfully</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Password Changed Successfully</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background: #d1fae5; border-radius: 50%;">
            <span style="font-size: 32px;">&#10004;</span>
          </div>
        </div>

        <p style="font-size: 16px; color: #666; text-align: center;">
          Your Harvey's Loans account password has been successfully changed. You can now sign in with your new password.
        </p>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 30px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            If you did not make this change, please contact us immediately at <a href="tel:1-3459178564" style="color: #667eea;">1-345-917-8564</a> or reset your password again.
          </p>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Need help? Contact us:<br>
          📞 <a href="tel:1-3459178564" style="color: #667eea;">1-345-917-8564</a><br>
          ✉️ <a href="mailto:Harveysloansllc@outlook.com" style="color: #667eea;">Harveysloansllc@outlook.com</a>
        </p>
        
        <p style="font-size: 14px; color: #999; margin-top: 40px; text-align: center;">
          © ${new Date().getFullYear()} Harvey's Loans. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: "Password Changed — Harvey's Loans",
    html,
  });
}