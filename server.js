// Pastikan baris ini ada di paling atas
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Ambil URI dari variabel lingkungan yang sudah dimuat
const dbUri = process.env.MONGODB_URI;

if (!dbUri) {
  console.error('ERROR: MONGODB_URI tidak ditemukan di file .env');
  process.exit(1); // Hentikan server jika URI tidak ada
}

// Koneksi ke MongoDB
mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB terhubung...'))
  .catch(err => console.error('Gagal terhubung ke MongoDB:', err));

// Routes
app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});