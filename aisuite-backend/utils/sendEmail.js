const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Create Transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Or use 'host' and 'port' if not using Gmail service
    auth: {
      user: process.env.SMTP_EMAIL, // Your email
      pass: process.env.SMTP_PASSWORD // Your App Password (Not login password)
    }
  });

  // 2. Define Email Options
  const mailOptions = {
    from: `"AiSuite Support" <${process.env.SMTP_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html: options.html // You can add HTML templates later if you want pretty emails
  };

  // 3. Send Email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;