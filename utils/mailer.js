// utils/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

exports.sendVerifyEmail = (to, token) => {
  const link = `${process.env.BASE_URL}/api/auth/verify/${token}`;
  return transporter.sendMail({
    from: `"BeritaApp" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verifikasi Email Anda',
    html: `<p>Klik link berikut untuk verifikasi akun Anda:</p><a href="${link}">${link}</a>`,
  });
};