const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
  // NEW FIELDS
  dueDate: { type: Date, default: null },
  borrowedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  holds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] 
});

module.exports = mongoose.model('Book', BookSchema);

const { protect, adminOnly } = require('../middleware/authMiddleware');

