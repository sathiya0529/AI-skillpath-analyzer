// Email service — sends real emails via SMTP when configured, otherwise
// logs to the console so the app keeps working in local development.
const nodemailer = require('nodemailer');

let transporter = null;
let ready = false;

function init() {
  try {
    const { SMTP_SERVICE, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
    if (SMTP_SERVICE && SMTP_USER && SMTP_PASS) {
      transporter = nodemailer.createTransport({ service: SMTP_SERVICE, auth: { user: SMTP_USER, pass: SMTP_PASS } });
      ready = true;
    } else if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT || 587),
        secure: String(SMTP_SECURE).toLowerCase() === 'true',
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
      ready = true;
    } else {
      ready = false;
      console.log('ℹ️  SMTP not configured — OTP emails will be logged to this console instead (set SMTP_* in backend/.env to send real emails).');
    }
  } catch (e) {
    ready = false;
    console.warn('⚠️  Mailer init failed:', e.message);
  }
}
init();

const isMailerReady = () => ready && !!transporter;

async function sendMail({ to, subject, html, text }) {
  if (!isMailerReady()) {
    console.log(`\n✉️  [DEV MAIL — SMTP not configured]\nTo: ${to}\nSubject: ${subject}\n${text || ''}\n`);
    return { devMode: true };
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  try {
    await transporter.sendMail({ from, to, subject, html, text });
    return { devMode: false };
  } catch (e) {
    // Keep local/dev login flows usable when an SMTP provider is configured but unreachable.
    ready = false;
    console.warn(`⚠️  SMTP send failed — using dev OTP fallback: ${e.message}`);
    console.log(`\n✉️  [DEV MAIL FALLBACK]\nTo: ${to}\nSubject: ${subject}\n${text || ''}\n`);
    return { devMode: true, error: e.message };
  }
}

async function sendOtpEmail(to, otp, { purpose = 'login', minutes = 10 } = {}) {
  const isReset = purpose === 'reset';
  const subject = isReset ? 'SkillPath — Password reset code' : 'SkillPath — Login verification code';
  const heading = isReset ? 'Reset your password' : "Verify it's you";
  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: auto; color: #111;">
      <h2 style="color:#4f46e5; margin-bottom: 4px;">SkillPath</h2>
      <p style="font-size: 15px;">${heading}</p>
      <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; background:#f3f4f6; padding: 14px 18px; border-radius: 10px; display:inline-block; margin: 10px 0;">${otp}</div>
      <p style="font-size: 13.5px; color: #555;">This code expires in ${minutes} minutes. If you didn't request this, you can safely ignore this email.</p>
    </div>`;
  const text = `Your SkillPath ${isReset ? 'password reset' : 'login verification'} code is ${otp}. It expires in ${minutes} minutes.`;
  return sendMail({ to, subject, html, text });
}

module.exports = { sendMail, sendOtpEmail, isMailerReady };
