const nodemailer = require('nodemailer');

// Configure Gmail SMTP Transporter with explicit host/port
const createTransporter = () => {
  const user = process.env.GMAIL_USER || process.env.EMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS;

  console.log(`[VOLNXT EMAIL] Configuring SMTP for user: ${user ? user : '(not set)'}`);

  if (user && pass) {
    // Strip spaces from app password (Google shows them grouped but they should be contiguous)
    const cleanPass = pass.replace(/\s+/g, '');

    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // STARTTLS on port 587
      auth: {
        user: user,
        pass: cleanPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return null;
};

/**
 * Send branded 6-digit OTP email for password reset
 */
const sendOtpEmail = async (toEmail, otp, recipientName = 'VOLNXT Member') => {
  const transporter = createTransporter();
  const brandName = 'VOLNXT';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
          .card { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
          .header { background: #000000; color: #ffffff; padding: 32px 24px; text-align: center; }
          .logo { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; }
          .badge { display: inline-block; background: rgba(16, 185, 129, 0.2); color: #10b981; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-top: 8px; border: 1px solid rgba(16, 185, 129, 0.4); }
          .body { padding: 32px 28px; }
          .greeting { font-size: 18px; font-weight: 700; color: #000000; margin-bottom: 8px; }
          .desc { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px; }
          .otp-container { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; }
          .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #000000; font-family: monospace; }
          .expiry { font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 500; }
          .security-note { font-size: 12px; color: #64748b; border-left: 3px solid #10b981; padding-left: 12px; margin-top: 20px; line-height: 1.5; }
          .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="logo">${brandName}</div>
            <div class="badge">Security & Account Verification</div>
          </div>
          <div class="body">
            <div class="greeting">Password Reset Request</div>
            <div class="desc">
              Hello ${recipientName},<br>
              We received a request to reset your ${brandName} account password. Enter the one-time verification code below to verify your identity:
            </div>
            <div class="otp-container">
              <div class="otp-code">${otp}</div>
              <div class="expiry">Expires in 10 minutes</div>
            </div>
            <div class="security-note">
              <strong>Security Alert:</strong> If you did not request this verification code, please ignore this email or reach out to VOLNXT Security. Never share this code with anyone.
            </div>
          </div>
          <div class="footer">
            &copy; 2026 ${brandName} Technologies Inc. &bull; Decentralized EV Fast Charging Grid
          </div>
        </div>
      </body>
    </html>
  `;

  if (transporter) {
    try {
      const senderEmail = process.env.GMAIL_USER || process.env.EMAIL_USER;
      const info = await transporter.sendMail({
        from: `"${brandName} Security" <${senderEmail}>`,
        to: toEmail,
        subject: `${otp} is your ${brandName} Password Reset Code`,
        html: htmlContent
      });
      console.log(`[VOLNXT AUTH] ✅ OTP email sent successfully to ${toEmail} | MessageId: ${info.messageId}`);
      return { success: true, mode: 'gmail_sent' };
    } catch (err) {
      console.error(`[VOLNXT AUTH] ❌ Gmail SMTP error:`, err.message);
      console.error(`[VOLNXT AUTH] Full error:`, err);
      // Fallback: return devOtp so user can still test locally
      console.log(`[VOLNXT AUTH DEV FALLBACK] OTP for ${toEmail} is: ${otp}`);
      return { success: true, mode: 'dev_fallback', devOtp: otp };
    }
  } else {
    console.log(`[VOLNXT AUTH] No Gmail credentials in .env. Generated OTP for ${toEmail}: ${otp}`);
    return { success: true, mode: 'dev_fallback', devOtp: otp };
  }
};

module.exports = { sendOtpEmail };
