// models/comment.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  articleIdentifier: {
    type: String,
    required: true,
    index: true,
  },
  author: {
    type: String,
    required: true,
    default: 'Pengguna Anonim',
  },
  text: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Comment', CommentSchema);