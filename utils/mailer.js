// utils/mailer.js
//
// Sends password reset emails using SMTP settings the shop owner
// configures in .env. If they haven't set this up (very possible for a
// small shop that never bothered), we don't crash -- we simply report
// that email isn't configured, so the app can show a helpful fallback
// message instead ("ask your owner to reset it from Staff Accounts").

let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (err) {
  nodemailer = null;
}

function isEmailConfigured() {
  return !!(
    nodemailer &&
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

async function sendPasswordResetEmail(toEmail, resetLink, shopName) {
  if (!isEmailConfigured()) {
    return { sent: false, reason: 'Email is not configured for this shop.' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject: `Reset your password — ${shopName}`,
      text: `Someone requested a password reset for your ${shopName} account.\n\nClick this link within 30 minutes to set a new password:\n${resetLink}\n\nIf you didn't request this, you can safely ignore this email.`,
    });

    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}

module.exports = { isEmailConfigured, sendPasswordResetEmail };
