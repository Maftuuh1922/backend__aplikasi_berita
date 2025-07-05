require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: ['https://icbs.my.id', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Upload folder for image access
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DB Connect
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Routes
app.use('/api', require('./routes/api'));
app.use('/api/auth', require('./routes/auth'));

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Registration page route
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Terjadi kesalahan pada server' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});