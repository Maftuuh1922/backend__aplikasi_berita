// routes/comments.js
const express = require('express');
const router = express.Router();
const Comment = require('../models/comment'); // Pastikan Anda mengimpor model Comment

// Contoh rute untuk mendapatkan semua komentar
router.get('/', async (req, res) => {
  try {
    const comments = await Comment.find().sort({ timestamp: -1 }); // Ambil semua komentar, urutkan terbaru
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Gagal memuat data komentar.' });
  }
});

module.exports = router;
