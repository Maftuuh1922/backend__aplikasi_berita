const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Comment = require('../models/comment');

// Inisialisasi Google Auth Client
// Pastikan Anda sudah menambahkan GOOGLE_CLIENT_ID di file .env Anda
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- RUTE UNTUK AUTENTIKASI ---
router.post('/auth/google', async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { name, email, sub, picture } = ticket.getPayload();

    let user = await User.findOne({ googleId: sub });

    if (!user) {
      // Jika user belum ada, buat user baru di database kita
      user = new User({
        googleId: sub,
        email: email,
        displayName: name,
        photoUrl: picture,
      });
      await user.save();
    }

    // Buat token JWT kita sendiri untuk sesi login di aplikasi
    const appToken = jwt.sign({ id: user._id, name: user.displayName }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ token: appToken, user: { name: user.displayName, email: user.email } });

  } catch (error) {
    console.error("Error verifikasi token Google:", error);
    res.status(401).json({ message: 'Login gagal, token tidak valid.' });
  }
});


// --- RUTE UNTUK KOMENTAR ---

// GET komentar untuk artikel tertentu
router.get('/articles/:articleId/comments', async (req, res) => {
  try {
    const articleIdentifier = decodeURIComponent(req.params.articleId);
    const comments = await Comment.find({ articleIdentifier: articleIdentifier }).sort({ timestamp: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST komentar baru
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

module.exports = router;