const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, required: true},
  category: { type: String },
  isAvailable: { type: Boolean, default: true },
  description: { type: String, default: "" },
  dueDate: { type: Date, default: null },
  borrowedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  holds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isDeleted: { type: Boolean, default: false }, 
  holdStartedAt: { type: Date, default: null }
});

module.exports = mongoose.model('Book', BookSchema);