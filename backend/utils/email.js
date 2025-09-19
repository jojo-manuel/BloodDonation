const nodemailer = require("nodemailer");

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });
};

const sendEmail = async (to, subject, text) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject,
    text,
  };
  return await transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };
