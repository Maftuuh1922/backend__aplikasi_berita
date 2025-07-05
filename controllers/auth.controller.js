// controllers/auth.controller.js
const User   = require('../models/users');   // sesuaikan nama file model
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const nodemailer = require('nodemailer');

exports.register = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ msg: 'Lengkapi data' });
    }

    // cek email duplikat
    if (await User.findOne({ email })) {
      return res.status(409).json({ msg: 'Email sudah terdaftar' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hash, displayName });

    // ① buat token verifikasi berlaku 24 jam
    const verifyToken = jwt.sign(
      { uid: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    user.verifyToken = verifyToken;
    user.verifyTokenExp = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    // ② kirim email
    await sendVerificationMail(user.email, verifyToken);

    res.status(201).json({ message: 'Registrasi berhasil, cek email untuk verifikasi' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Terjadi kesalahan saat registrasi', error: err.message });
  }
};

async function sendVerificationMail(to, token) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',             // atau smtp host lain
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // app‑password / SMTP key
    },
  });

  const url = `https://icbs.my.id/api/auth/verify?token=${token}`;

  await transporter.sendMail({
    from: '"FOKUS News" <no‑reply@icbs.my.id>',
    to,
    subject: 'Verifikasi email Anda',
    html: `
      <h3>Halo!</h3>
      <p>Klik tombol di bawah untuk memverifikasi email Anda.</p>
      <a href="${url}" style="padding:10px 20px;background:#3478f6;color:#fff;text-decoration:none;border-radius:4px;">
        Verifikasi Email
      </a>
      <p>Link berlaku 24 jam.</p>
    `,
  });
}

exports.login = async (req, res) => {
  /* … kode login … */
};
