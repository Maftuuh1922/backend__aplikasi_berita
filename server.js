// server.js - FIXED VERSION
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // Add this for password hashing

/* ────────── App & Config ────────── */
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB = process.env.MONGO_URI || process.env.MONGODB_URI;

console.log('🚀 Starting server...');

/* ────────── CORS ────────── */
app.use(cors({
  origin: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS','HEAD'],
  allowedHeaders: ['Content-Type','Authorization','Accept','Origin','X-Requested-With'],
  credentials: true
}));

/* ────────── Body Parsers ────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ────────── User Schema ────────── */
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password required only if not Google user
    }
  },
  googleId: {
    type: String,
    sparse: true, // This allows multiple null values
    unique: true  // But still unique for non-null values
  },
  name: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create compound index to handle both email and Google users
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });

const User = mongoose.model('User', userSchema);

/* ────────── Registration Route - FIXED ────────── */
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('📝 Registration attempt:', req.body);
    
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create new user
    const newUser = new User({
      email,
      password: hashedPassword
    });
    
    await newUser.save();
    
    console.log('✅ User registered successfully:', email);
    
    // Return success response in the format the app expects
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: newUser._id,
        email: newUser.email,
        createdAt: newUser.createdAt
      }
    });
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

/* ────────── Login Route ────────── */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

/* ────────── Test Routes ────────── */
app.get('/test', (req, res) => {
  res.json({
    message: 'Server is working!',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'FOKUS API Server',
    endpoints: [
      'GET /test',
      'POST /api/auth/register',
      'POST /api/auth/login'
    ]
  });
});

/* ────────── Error Handler ────────── */
app.use((err, req, res, next) => {
  console.error('ERROR:', err.message);
  res.status(500).json({ 
    success: false,
    message: 'Server error' 
  });
});

/* ────────── Database Connection ────────── */
const connectDB = require('./config/database');
connectDB();

/* ────────── Start Server ────────── */
console.log('📡 Connecting to MongoDB...');
mongoose.connect(MONGODB)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🔗 Test: http://localhost:${PORT}/test`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB error:', err);
    process.exit(1);
  });