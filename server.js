// server.js  ── CommonJS version
require('dotenv').config();

const path      = require('path');
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');

/* ────────── Import routers ────────── */
const authRoutes     = require('./routes/auth');
const profileRoutes  = require('./routes/profile');
const articleRoutes  = require('./routes/articles');
const commentRoutes  = require('./routes/comments');
const uploadRoutes   = require('./routes/upload');
const apiRoutes      = require('./routes/api');   // router umum

/* ────────── App & Config ────────── */
const app  = express();
const PORT = process.env.PORT || 3000;
const MONGODB = process.env.MONGO_URI || process.env.MONGODB_URI;

/* ────────── Basic Logging ────────── */
app.use((req, _, next) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  next();
});

/* ────────── CORS ────────── */
app.use(cors({
  origin: ['https://icbs.my.id', 'http://localhost:3000'],
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS','HEAD'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
}));

/* ────────── Body Parsers ────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ────────── Static Files ────────── */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(__dirname)); // mis. index.html, register.html

/* ────────── Routes ────────── */
app.use('/api/auth', authRoutes);
app.use('/api/profile',  profileRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/upload',   uploadRoutes);
app.use('/api', apiRoutes);            // root API umum

/* ────────── HTML fallback (optional) ────────── */
app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/register', (_, res) => res.sendFile(path.join(__dirname, 'register.html')));

/* ────────── 404 Handler ────────── */
app.use((_, res) => res.status(404).send('Not Found'));

/* ────────── Global Error Handler ────────── */
app.use((err, _, res, __) => {
  console.error('GLOBAL ERROR:', err.stack);
  res.status(500).json({ message: 'Terjadi kesalahan pada server' });
});

/* ────────── MongoDB & Server Start ────────── */
mongoose.connect(MONGODB)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, '0.0.0.0', () =>
      console.log(`🚀 Server berjalan di http://localhost:${PORT}`));
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));
