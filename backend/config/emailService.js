const nodemailer = require('nodemailer');
const env = require('./env');

// Create transporter for Gmail
const createTransporter = () => {
  if (!env.GMAIL_USER || !env.GMAIL_PASS) {
    console.warn('Gmail credentials not configured. Email notifications will be disabled.');
    return null;
  }

  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: env.GMAIL_USER,
      pass: env.GMAIL_PASS
    }
  });
};

// Send email function
const sendEmail = async (to, subject, text, html = null) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn('Email transporter not available. Skipping email send.');
    return false;
  }

  try {
    const mailOptions = {
      from: env.GMAIL_USER,
      to,
      subject,
      text,
      ...(html && { html })
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

module.exports = {
  createTransporter,
  sendEmail
};
