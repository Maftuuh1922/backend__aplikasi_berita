const express  = require('express');
const router   = express.Router();
const jwt      = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const multer   = require('multer');

const User     = require('../models/user');
const Comment  = require('../models/comment');
const { verifyToken } = require('../middleware/auth'); // ← perbaikan path

/* ── Google OAuth2 client ── */
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* ── Multer setup ── */
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, 'uploads/'),
  filename:    (_, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

/* ── Login Google ── */
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
    res.json({ token: appToken, user: { name: user.displayName, email, photo: user.photoUrl } });
  } catch (e) {
    console.error('Google token invalid', e);
    res.status(401).json({ message: 'Login Google gagal' });
  }
});

/* ── Komentar ── */
router.get('/articles/:articleId/comments', async (req, res) => {
  try {
    const art = decodeURIComponent(req.params.articleId);
    res.json(await Comment.find({ articleIdentifier: art }).sort({ timestamp: -1 }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/articles/:articleId/comments', verifyToken, async (req, res) => {
  try {
    const newCom = await Comment.create({
      articleIdentifier: decodeURIComponent(req.params.articleId),
      author: req.user.name,
      text: req.body.text,
    });
    res.status(201).json(newCom);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

/* ── Upload foto profil ── */
router.post('/upload-profile', verifyToken, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

module.exports = router;
