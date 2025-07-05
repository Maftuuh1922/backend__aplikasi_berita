// models/Bookmark.js
const mongoose = require('mongoose');
module.exports = mongoose.model('Bookmark', new mongoose.Schema({
  articleUrl  : { type: String, required: true },
  articleTitle: String,
  user        : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true }));
