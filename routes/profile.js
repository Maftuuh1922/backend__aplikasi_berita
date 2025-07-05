// routes/profile.js
const express = require('express');
const router = express.Router();
const User = require('../models/user'); // Pastikan Anda mengimpor model User

// Contoh rute untuk mendapatkan data ringkasan pengguna
// Sesuaikan dengan kebutuhan dashboard Anda (misalnya, total user, user online)
router.get('/data', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    // Untuk 'users online', Anda perlu logika tambahan (misalnya, field lastActive di model User)
    const usersOnline = 0; // Placeholder, perlu implementasi real-time
    res.json({
      totalUsers: totalUsers,
      usersOnline: usersOnline,
      message: 'Data pengguna berhasil dimuat.'
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Gagal memuat data pengguna.' });
  }
});

module.exports = router;
