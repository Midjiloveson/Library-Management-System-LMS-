const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const User = require('../models/User'); 
const { protect, adminOnly } = require('../middleware/authMiddleware'); 

// --- 1. GENERAL ROUTES (Public) ---

// Get all books
router.get('/', async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search for books
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: "Search query is required" });

    const books = await Book.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { author: { $regex: query, $options: 'i' } },
        { isbn: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    });
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- 2. BORROWING LOGIC (Protected) ---

// Borrow a book
router.put('/borrow/:id', protect, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    const user = await User.findById(req.user.id);

    if (!book) return res.status(404).json({ message: "Book not found" });
    if (!book.isAvailable) return res.status(400).json({ message: "Book is already checked out" });
    if (user.borrowedBooks.length >= 10) return res.status(400).json({ message: "Limit reached: Max 10 books." });

    const twoWeeksOut = new Date();
    twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);

    book.isAvailable = false;
    book.dueDate = twoWeeksOut;
    book.borrowedBy = user._id;
    await book.save();

    user.borrowedBooks.push(book._id);
    await user.save();

    res.json({ message: `Success! Return "${book.title}" by ${twoWeeksOut.toDateString()}` });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// Renew a book
router.put('/renew/:id', protect, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    
    if (!book.borrowedBy || book.borrowedBy.toString() !== req.user.id) {
        return res.status(403).json({ message: "You cannot renew a book you haven't borrowed." });
    }
    
    if (book.holds && book.holds.length > 0) {
        return res.status(400).json({ message: "Renewal denied: A hold is placed on this book." });
    }

    const newDueDate = new Date(book.dueDate || new Date());
    newDueDate.setDate(newDueDate.getDate() + 14);
    book.dueDate = newDueDate;
    await book.save();

    res.json({ message: `Renewed! New date: ${newDueDate.toDateString()}` });
  } catch (err) {
    res.status(500).json({ message: "Renewal failed" });
  }
});

// Return a book
router.put('/return/:id', protect, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book || book.isAvailable) return res.status(400).json({ message: "Book is already in the library" });

    const user = await User.findById(book.borrowedBy);
    
    book.isAvailable = true;
    book.dueDate = null;
    book.borrowedBy = null;
    await book.save();

    if (user) {
      user.borrowedBooks = user.borrowedBooks.filter(id => id.toString() !== req.params.id);
      await user.save();
    }
    res.json({ message: "Book returned successfully" });
  } catch (err) {
    res.status(500).json({ message: "Return failed" });
  }
});

// --- 3. ADMIN ROUTES ---

// Add a book
router.post('/add', protect, adminOnly, async (req, res) => {
  try {
    const newBook = new Book(req.body);
    const savedBook = await newBook.save();
    res.status(201).json(savedBook);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a book
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: "Book deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;