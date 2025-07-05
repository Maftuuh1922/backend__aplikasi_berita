/**
 * middleware/auth.js
 *
 * Middleware JWT untuk memverifikasi token Bearer.
 * ▸ Mengecek header Authorization → "Bearer <token>"
 * ▸ Meng‐decode token dan menaruh payload di req.user
 * ▸ Menolak request jika token hilang, tidak valid, atau kedaluwarsa
 */

require('dotenv').config();           // pastikan .env dibaca
const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  // Ambil header Authorization
  const authHeader = req.headers['authorization'] || '';

  // Ekstrak token setelah kata "Bearer "
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)             // lebih cepat dari split
    : null;

  // Tidak ada token?
  if (!token) {
    return res.status(401).json({ msg: 'Unauthorized - token missing' });
  }

  try {
    // Verifikasi dan dapatkan payload
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Simpan payload ke req.user supaya bisa diakses controller
    req.user = payload;

    // Lanjut ke handler berikutnya
    next();
  } catch (err) {
    // Token invalid, signature salah, atau expired
    return res.status(401).json({
      msg: 'Token invalid or expired',
      error: err.message,
    });
  }
};
