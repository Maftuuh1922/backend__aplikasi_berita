import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email:       { type: String, required: true, unique: true },
    password:    { type: String },                         // kosong bila login Google‑only
    googleId:    { type: String, unique: true, sparse: true },

    displayName: { type: String, required: true },
    photoUrl:    { type: String }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model('User', userSchema);
