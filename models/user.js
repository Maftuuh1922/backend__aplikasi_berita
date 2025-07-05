// models/User.js
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

/**
 *  userSchema
 *  ----------
 *  • email      : wajib unik – identitas utama
 *  • password   : optional – kosong jika user hanya masuk lewat Google
 *  • googleId   : id Google OAuth (optional, unique + sparse)
 *  • displayName: nama yang ditampilkan di aplikasi
 *  • photoUrl   : URL foto profil
 */
const userSchema = new mongoose.Schema(
  {
    email:       { type: String, required: true, unique: true, lowercase: true },
    password:    { type: String },                               // optional
    googleId:    { type: String, unique: true, sparse: true },  // optional

    displayName: { type: String, required: true },
    photoUrl:    { type: String }
  },
  { timestamps: true }
);

/* ------------------------------------------------------------------ */
/*  HASH PASSWORD OTOMATIS SEBELUM DISIMPAN (jika password ada/diubah) */
/* ------------------------------------------------------------------ */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next(); // skip kalau tidak ada / tidak berubah
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

/* ---------------------------------------- */
/*  METHOD INSTANCE: validasi password user */
/* ---------------------------------------- */
userSchema.methods.matchPassword = function (plainText) {
  if (!this.password) return false;               // akun Google‑only
  return bcrypt.compare(plainText, this.password);
};

module.exports = mongoose.model('User', userSchema);
