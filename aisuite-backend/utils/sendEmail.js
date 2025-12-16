// const nodemailer = require('nodemailer');

// const sendEmail = async (options) => {
//   // 1. Create Transporter
//   const transporter = nodemailer.createTransport({
//     service: 'gmail', // Or use 'host' and 'port' if not using Gmail service
//     auth: {
//       user: process.env.SMTP_EMAIL, // Your email
//       pass: process.env.SMTP_PASSWORD // Your App Password (Not login password)
//     }
//   });

//   // 2. Define Email Options
//   const mailOptions = {
//     from: `"AiSuite Support" <${process.env.SMTP_EMAIL}>`,
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//     // html: options.html // You can add HTML templates later if you want pretty emails
//   };

//   // 3. Send Email
//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;

// utils/sendEmail.js
const nodemailer = require('nodemailer');
const log = require('./logger');

/**
 * Returns SMTP settings from dynamic DB config or fallback ENV.
 */
function getSmtpSettings() {
  const cfg = global.SystemEnv || {};

  return {
    host: cfg.SMTP_HOST || process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(cfg.SMTP_PORT || process.env.SMTP_PORT || 587),
    secure: cfg.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "true",
    auth: {
      user: cfg.SMTP_EMAIL || process.env.SMTP_EMAIL,
      pass: cfg.SMTP_PASSWORD || process.env.SMTP_PASSWORD
    }
  };
}

/**
 * Sends Email Using Dynamic SMTP
 */
const sendEmail = async (options) => {
  const smtpConfig = getSmtpSettings();

  const transporter = nodemailer.createTransport(smtpConfig);

  const mailOptions = {
    from: `"AiSuite Support" <${smtpConfig.auth.user}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(mailOptions);
  log("INFO", `Email sent to ${options.email}`);
};

module.exports = sendEmail;
