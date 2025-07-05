// routes/auth.js
const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

const User = require('../models/user');
// const { sendVerifyEmail } = require('../utils/mailer'); // Anda belum menggunakannya, bisa dihapus atau diimplementasikan
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Nodemailer (contoh SMTP Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

/* ---------- REGISTER ---------- */
router.post('/register', async (req, res) => {
  const { email, password, displayName } = req.body;
  if (!email || !password || !displayName) {
    return res.status(400).json({ message: 'Lengkapi data' });
  }
  if (await User.findOne({ email })) {
    return res.status(409).json({ message: 'Email sudah terdaftar' });
  }

  const verifyToken = uuidv4(); // Ini adalah UUID, BUKAN JWT
  const user = await User.create({
    email, password, displayName,
    isVerified : false,
    verifyToken // Simpan UUID ini di database
  });

  // Kirim email konfirmasi
  const link = `${process.env.BASE_URL}/api/auth/verify/${verifyToken}`; // Tautan ini berisi UUID
  await transporter.sendMail({
    from   : '"Fokus Berita" <no-reply@icbs.my.id>',
    to     : email,
    subject: 'Verifikasi e‑mail Anda',
    html   : `<p>Halo ${displayName}, klik tautan berikut untuk verifikasi:</p>
              <a href="${link}">${link}</a>`
  });

  res.status(201).json({ message: 'Silakan cek inbox untuk verifikasi.' });
});

/* --- Kirim ulang email --- */
router.post('/resend', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
  if (user.isVerified) return res.json({ message: 'Sudah terverifikasi' });

  // Buat UUID baru untuk token verifikasi
  user.verifyToken = uuidv4();
  await user.save();

  const link = `${process.env.BASE_URL}/api/auth/verify/${user.verifyToken}`;
  await transporter.sendMail({
    from: '"Fokus Berita" <no-reply@icbs.my.id>',
    to  : email,
    subject: 'Verifikasi ulang',
    html: `<p>Klik tautan untuk verifikasi:</p><a href="${link}">${link}</a>`
  });

  res.json({ message: 'Link verifikasi dikirim.' });
});

/* --------------------------- LOGIN GOOGLE --------------------------- */
router.post('/google', async (req, res) => {
  const { token } = req.body; // Ini adalah token dari Google (ID Token)

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { sub: googleId, email, name, picture } = ticket.getPayload();

    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.create({
        googleId,
        email,
        displayName: name,
        photoUrl: picture,
        isVerified: true, // Asumsi email terverifikasi jika login via Google
      });
    }

    // Buat JWT Anda sendiri (access token)
    const appToken = jwt.sign(
      { id: user._id, displayName: user.displayName, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token: appToken, // Kirim access token ini ke Flutter
      user: {
        name: user.displayName,
        email: user.email,
        photo: user.photoUrl || ''
      }
    });
  } catch (e) {
    console.error('Google login error:', e);
    res.status(401).json({ message: 'Login Google gagal', error: e.message });
  }
});

// ********** CATATAN PENTING **********
// Anda memiliki dua rute '/verify'.
// router.get('/verify', ...): Ini mencoba memverifikasi JWT yang dikirim sebagai query parameter.
// router.get('/verify/:token', ...): Ini memverifikasi UUID yang dikirim sebagai path parameter (dari email).
// Kita akan fokus pada yang kedua karena itu yang Anda kirim via email.
// Rute pertama router.get('/verify') sepertinya tidak digunakan atau salah konfigurasi untuk verifikasi email.
// Jika Anda memang ingin verifikasi via JWT di URL, Anda harus mengubah cara Anda membuat link email.
// Untuk kasus Anda, saya akan mengomentari atau menyarankan untuk menghapus rute yang tidak relevan.

// router.get('/verify', async (req, res) => {
//   const { token } = req.query;
//   try {
//     const payload = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(payload.uid); // Perhatikan: payload.uid vs payload.id
//     if (!user || user.verifyToken !== token) throw new Error('Token tidak valid');

//     user.emailVerified = true;
//     user.verifyToken = undefined;
//     user.verifyTokenExp = undefined;
//     await user.save();

//     return res.send('Email berhasil diverifikasi. Silakan login di aplikasi.');
//   } catch (e) {
//     return res.status(400).send('Token verifikasi tidak valid / kedaluwarsa');
//   }
// });

router.get('/verify/:token', async (req, res) => {
  const user = await User.findOne({ verifyToken: req.params.token }); // Mencari user berdasarkan UUID
  if (!user) {
    // Tambahkan log untuk debug
    console.log('User not found or token mismatch for verify path:', req.params.token);
    return res.status(400).send('Link tidak valid / sudah kedaluwarsa');
  }

  user.isVerified  = true;
  user.verifyToken = undefined; // Hapus token setelah verifikasi
  await user.save();

  res.send('✅ E‑mail terverifikasi. Silakan login.');
});

/* --- Cek status --- */
router.get('/verified', async (req, res) => {
  const authHeader = req.headers.authorization || ''; // Ganti nama variabel agar lebih jelas
  const token = authHeader.replace('Bearer ', '');

  // Log untuk debugging: Pastikan token diterima dan formatnya
  console.log('Authorization Header:', authHeader);
  console.log('Extracted Token for /verified:', token);

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided.' });
  }

  try {
    // access‑token adalah JWT yang Anda buat saat user login
    // Ini adalah baris yang menyebabkan error jika token adalah UUID
    const payload = jwt.verify(token, process.env.JWT_SECRET); // Di sini error "jwt malformed" terjadi jika token bukan JWT
    
    // Perhatikan: payload.id atau payload.uid? Konsistenkan dengan jwt.sign Anda.
    // Di login dan google login, Anda pakai { id: user._id }
    const user = await User.findById(payload.id); // Gunakan payload.id
    
    if (!user) {
        return res.status(404).json({ message: 'User not found for provided token.' });
    }

    res.json({ verified: !!user.isVerified });
  } catch (e) {
    // Log error spesifik JWT
    console.error('Error verifying token in /verified:', e.name, e.message);
    if (e.name === 'JsonWebTokenError') {
        if (e.message === 'jwt malformed') {
            return res.status(401).json({ message: 'Token tidak valid: format JWT salah.' });
        } else if (e.message === 'invalid signature') {
            return res.status(401).json({ message: 'Token tidak valid: tanda tangan tidak cocok.' });
        } else if (e.message === 'jwt expired') {
            return res.status(401).json({ message: 'Token tidak valid: token kadaluarsa.' });
        }
    }
    res.status(401).json({ message: 'Token tidak valid.' });
  }
});

/* ----------------------------- LOGIN (email & password) ----------------------------- */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'Email tidak ditemukan' });

  const match = await bcrypt.compare(password, user.password || '');
  if (!match) return res.status(401).json({ message: 'Password salah' });

  if (!user.isVerified) {
    return res.status(403).json({ message: 'Akun belum diverifikasi. Cek email Anda.' });
  }

  // Buat JWT (access token) untuk user yang login
  const token = jwt.sign({ id: user._id, email, name: user.displayName }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.json({ token, user: { name: user.displayName, email, photo: user.photoUrl } });
});

module.exports = router;