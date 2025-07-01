const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const User = require('../models/user');
const Comment = require('../models/comment');

// ✅ Inisialisasi Firebase Admin SDK pakai file service account
const serviceAccount = require('../berita-komentar-maftuh-firebase-adminsdk-fbsvc-9a64386d29.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// --- RUTE UNTUK AUTENTIKASI DARI FLUTTER ---
router.post('/auth/google', async (req, res) => {
  const { token } = req.body;

  try {
    // ✅ Verifikasi token Firebase dari Flutter
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, name, email, picture } = decodedToken;

    // ✅ Simpan atau cari user di MongoDB
    let user = await User.findOne({ googleId: uid });

    if (!user) {
      user = new User({
        googleId: uid,
        email: email,
        displayName: name || email,
        photoUrl: picture || '',
      });
      await user.save();
    }

    // ✅ Buat JWT aplikasi
    const appToken = jwt.sign(
      { id: user._id, name: user.displayName },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token: appToken,
      user: {
        name: user.displayName,
        email: user.email,
        photo: user.photoUrl,
      },
    });

  } catch (error) {
    console.error('❌ Error verifikasi token Firebase:', error);
    res.status(401).json({ message: 'Login gagal, token tidak valid.' });
  }
});

// --- RUTE KOMENTAR ---
router.get('/articles/:articleId/comments', async (req, res) => {
  try {
    const articleIdentifier = decodeURIComponent(req.params.articleId);
    const comments = await Comment.find({ articleIdentifier }).sort({ timestamp: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/articles/:articleId/comments', async (req, res) => {
  const comment = new Comment({
    articleIdentifier: decodeURIComponent(req.params.articleId),
    author: req.body.author,
    text: req.body.text,
  });

  try {
    const newComment = await comment.save();
    res.status(201).json(newComment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// --- RUTE DASHBOARD DATA ---
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data user' });
  }
});

router.get('/all-comments', async (req, res) => {
  try {
    const comments = await Comment.find().sort({ timestamp: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil komentar' });
  }
});

module.exports = router;
