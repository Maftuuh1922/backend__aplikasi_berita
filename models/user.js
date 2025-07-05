// models/user.js
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    // ――― Credensial utama
    email:      { type: String, required: true, unique: true },
    password:   { type: String },      // kosong/null kalau login Google‑only
    googleId:   { type: String, unique: true, sparse: true }, // optional

    // ――― Profil
    displayName: { type: String, required: true },
    photoUrl:    { type: String },

    // ――― Tambahan
  },
  { timestamps: true }
);

/* Hash password sebelum save (hanya kalau field password diubah/diisi) */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

/* Helper untuk verifikasi password login email‑password */
userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);
