// routes/api.js  (ES‑Module)
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import multer from 'multer';

import User from '../models/user.js';
import Comment from '../models/comment.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

/* ------------------------------------------------------------------ */
/* 1. Register                                                        */
/* ------------------------------------------------------------------ */

router.options('/auth/register', (_, res) => res.sendStatus(204)); // CORS pre‑flight

router.get('/auth/register', (_, res) =>
  res.json({ message: 'Register endpoint OK – gunakan POST untuk mendaftar' })
);

router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email & password wajib' });
    }

    if (await User.findOne({ email })) {
      return res.status(409).json({ message: 'Email sudah terdaftar' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hash,
      displayName: displayName || email,
    });

    const token = jwt.sign(
      { id: user._id, name: user.displayName, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { name: user.displayName, email, photo: user.photoUrl || '' },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Terjadi kesalahan saat registrasi' });
  }
});

/* ------------------------------------------------------------------ */
/* 2. Google OAuth login                                              */
/* ------------------------------------------------------------------ */

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/auth/google', async (req, res) => {
  const { token } = req.body;
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
        displayName: name || email,
        photoUrl: picture || '',
      });
    }

    const appToken = jwt.sign(
      { id: user._id, name: user.displayName, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token: appToken,
      user: { name: user.displayName, email, photo: user.photoUrl },
    });
  } catch (e) {
    console.error('Google login error:', e);
    res.status(401).json({ message: 'Login Google gagal' });
  }
});

/* ------------------------------------------------------------------ */
/* 3. Komentar artikel                                                */
/* ------------------------------------------------------------------ */

router.get('/articles/:articleId/comments', async (req, res) => {
  try {
    const art = decodeURIComponent(req.params.articleId);
    const comments = await Comment.find({ articleIdentifier: art }).sort({ timestamp: -1 });
    res.json(comments);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/articles/:articleId/comments', verifyToken, async (req, res) => {
  try {
    const newCom = await Comment.create({
      articleIdentifier: decodeURIComponent(req.params.articleId),
      author: req.user.name,
      text: req.body.text,
    });
    res.status(201).json(newCom);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

/* ------------------------------------------------------------------ */
/* 4. Upload foto profil                                              */
/* ------------------------------------------------------------------ */

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, 'uploads/'),
  filename:    (_, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

router.post('/upload-profile', verifyToken, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

/* ------------------------------------------------------------------ */
export default router;
