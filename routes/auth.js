import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import multer from 'multer';

import User from '../models/user.js';
import Comment from '../models/comment.js';          // jika ada
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* ---------- REGISTER ---------- */
router.post('/register', async (req, res) => {
  console.log('\n-- REGISTER --', req.body);

  const { email, password, displayName } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email & password wajib' });

  try {
    if (await User.findOne({ email })) {
      return res.status(409).json({ message: 'Email sudah terdaftar' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hash, displayName });

    const token = jwt.sign({ id: user._id, name: user.displayName, email },
                           process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { name: user.displayName, email, photo: user.photoUrl || '' }
    });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ message: 'Terjadi kesalahan saat registrasi' });
  }
});

/* ---------- LOGIN GOOGLE ---------- */
router.post('/auth/google', async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const { sub: googleId, email, name, picture } = ticket.getPayload();

    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.create({ googleId, email, displayName: name, photoUrl: picture });
    }

    const appToken = jwt.sign({ id: user._id, name: user.displayName, email },
                              process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token: appToken, user: { name: user.displayName, email, photo: user.photoUrl } });
  } catch (e) {
    res.status(401).json({ message: 'Login Google gagal', error: e.message });
  }
});

export default router;
