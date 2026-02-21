const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, required: true, unique: true },
  description: String,
  category: String,
  isAvailable: { type: Boolean, default: true },
  borrower: { type: String, default: null },
  dueDate: { type: Date, default: null }
});

module.exports = mongoose.model('Book', BookSchema);