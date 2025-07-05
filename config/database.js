const mongoose = require('mongoose');
const MONGODB = process.env.MONGO_URI || 'mongodb://localhost:27017/aplikasi_berita';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

module.exports = connectDB;