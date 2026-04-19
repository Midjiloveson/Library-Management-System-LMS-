const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// --- 1. GENERAL ROUTES (Public) ---

// Get all books
router.get('/', bookController.getAllBooks);

// Search for books
router.get('/search', bookController.searchBooks);

// --- 2. BORROWING LOGIC (Protected) ---

// Get my books
router.get('/my-books', protect, bookController.getMyBorrowedBooks);

// View current hold deadlines
router.get('/my-holds', protect, bookController.getMyHolds);

// ... (other borrow, hold, return, renew routes)

// Borrow a book
router.put('/borrow/:id', protect, bookController.borrowBook);

// Place a hold on a book
router.put('/hold/:id', protect, bookController.placeHold);

// Renew a book
router.put('/renew/:id', protect, bookController.renewBook);

// Return a book
router.put('/return/:id', protect, bookController.returnBook);

// --- 3. ADMIN ROUTES ---

// Add a book
router.post('/add', protect, adminOnly, bookController.addBook);

// Delete a book
router.delete('/:id', protect, adminOnly, bookController.deleteBook);

// Admin checking in a book 
router.post('/admin/return/:id', protect, adminOnly, bookController.returnBook);

// Admin checking out for a user
router.post('/admin/borrow/:id', protect, adminOnly, bookController.borrowBook);

// Admin placing hold for a user
router.post('/admin/hold/:id', protect, adminOnly, bookController.placeHold);

// Admin renewing for a user
router.post('/admin/renew/:id', protect, adminOnly, bookController.renewBook);

module.exports = router;