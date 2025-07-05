// models/Comment.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Comment schema
 * --------------
 * • articleId / URL disimpan dalam 1 field   => articleIdentifier
 * • Bisa reply bertingkat via parent
 * • Like disimpan sebagai angka (atau array userId jika nanti perlu)
 * • Relasi optional ke User (untuk guest comment biarkan null + simpan author string)
 */
const CommentSchema = new Schema(
  {
    // URL, slug, atau ID unik artikel – cukup satu field
    articleIdentifier: { type: String, required: true, index: true },

    // Referensi User (bisa null jika guest)
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    // Nama penulis (ditampilkan). Jika user null gunakan displayName manual
    author: { type: String, required: true, default: 'Pengguna Anonim' },

    // Isi komentar
    text: { type: String, required: true },

    // Reply ke komentar lain (nested)
    parent: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },

    // Jumlah like (bisa diganti array untuk daftar userId liked)
    likeCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', CommentSchema);
