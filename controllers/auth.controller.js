// controllers/auth.controller.js
const User   = require('../models/users');   // sesuaikan nama file model
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Terjadi kesalahan saat registrasi', error: err.message });
  }
};

exports.login = async (req, res) => {
  /* … kode login … */
};
