const nodemailer = require('nodemailer');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from project root .env
const envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

// Read JSON payload from stdin
let inputData = '';
process.stdin.on('data', chunk => {
  inputData += chunk;
});

process.stdin.on('end', async () => {
  try {
    const payload = JSON.parse(inputData.trim());
    const { email, status, reason, caseId } = payload;

    if (!email) {
      console.error('Error: Recipient email is required');
      process.exit(1);
    }

    const host = process.env.SMTP_HOST || 'smtp.ethereal.email';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    let transporter;
    if (user && pass) {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });
      console.log(`Using configured SMTP transporter: ${host}:${port}`);
    } else {
      console.log('No SMTP credentials found in .env. Creating test Ethereal account...');
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    }

    const statusText = status.toLowerCase() === 'approved' ? 'APPROVED' : 'DECLINED';
    const emoji = status.toLowerCase() === 'approved' ? '🎉' : '❌';
    const subject = `[InsureTrust] Application Case #${caseId} Status Update: ${statusText} ${emoji}`;

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 25px;">
          <h2 style="color: #4c6cb3; font-weight: 800; margin: 0; font-size: 24px; tracking: -0.025em;">Insure<span style="color: #3a5293;">Trust</span></h2>
          <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; font-weight: 700;">Underwriting Intake Portal</span>
        </div>
        
        <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 12px;">Dear Applicant,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #334155;">This is an official notification regarding your life insurance application <strong>Case #${caseId}</strong>.</p>
        
        <div style="margin: 25px 0; padding: 20px; border-radius: 12px; text-align: center; border: 1px solid ${status.toLowerCase() === 'approved' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}; background-color: ${status.toLowerCase() === 'approved' ? '#f0fdf4' : '#fef2f2'};">
          <span style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: #94a3b8; display: block; margin-bottom: 6px; letter-spacing: 0.05em;">Case Determination</span>
          <span style="font-size: 22px; font-weight: 900; color: ${status.toLowerCase() === 'approved' ? '#047857' : '#b91c1c'}; letter-spacing: 0.05em; display: inline-flex; align-items: center; gap: 8px;">
            ${emoji} UNDERWRITING ${statusText}
          </span>
        </div>
        
        ${reason ? `
          <div style="margin: 20px 0; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; background-color: #f8fafc;">
            <span style="font-size: 10px; text-transform: uppercase; font-weight: 800; color: #64748b; display: block; margin-bottom: 8px; letter-spacing: 0.05em;">Underwriter Decision Notes</span>
            <span style="font-size: 13.5px; line-height: 1.6; font-style: italic; color: #475569; display: block;">"${reason}"</span>
          </div>
        ` : ''}
        
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-top: 25px;">You can view the full details of your application, flags list, and underwriting dossier by logging into your account dashboard.</p>
        
        <div style="border-top: 1px solid #f1f5f9; margin-top: 30px; padding-top: 20px; text-align: center;">
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">This email is automated. Please do not reply directly to this message.</p>
          <p style="font-size: 11px; color: #94a3b8; margin: 4px 0 0 0;">&copy; 2026 InsureTrust Underwriting Department.</p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: '"InsureTrust Underwriting" <no-reply@insuretrust.com>',
      to: email,
      subject,
      html
    });

    console.log('Notification email sent successfully. Msg ID:', info.messageId);
    if (!user || !pass) {
      console.log('Ethereal Sandbox Inbox URL:', nodemailer.getTestMessageUrl(info));
    }
    process.exit(0);
  } catch (err) {
    console.error('Fatal email execution error:', err);
    process.exit(1);
  }
});
