const Book = require('../models/Book');
const User = require('../models/User');

// --- 1. GENERAL ROUTES (Public) ---

exports.getAllBooks = async (req, res) => {
  try {
    const books = await Book.find({ isDeleted: false });
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyHolds = async (req, res) => {
  try {
    const userId = req.user.id;
    const pendingHolds = await Book.find({
      "holds.0": userId,
      borrowedBy: null,
      holdStartedAt: { $ne: null }
    });

    const holdsWithDeadlines = pendingHolds.map(book => {
      const expiresAt = new Date(book.holdStartedAt);
      expiresAt.setHours(expiresAt.getHours() + 48);
      return {
        title: book.title,
        bookId: book._id,
        expiresAt: expiresAt,
        formattedDeadline: expiresAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
        message: `You have until ${expiresAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} to pick up this book.`
      };
    });
    res.json(holdsWithDeadlines);
  } catch (err) {
    res.status(500).json({ message: "Error fetching holds", error: err.message });
  }
};

exports.searchBooks = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: "Search query is required" });

    const books = await Book.find({
      isDeleted: false,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { author: { $regex: query, $options: 'i' } },
        { isbn: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    }).limit(20);
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- 2. BORROWING & LIBRARIAN LOGIC ---

exports.borrowBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    const isAdmin = req.user.role === 'admin';
    const effectiveUserId = (isAdmin && req.body.targetUserId) ? req.body.targetUserId : req.user.id;
    
    const user = await User.findById(effectiveUserId);
    if (!book || book.isDeleted) return res.status(404).json({ message: "Book not found" });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (book.holds && book.holds.length > 0) {
      const nextInLine = book.holds[0].toString();
      if (nextInLine !== effectiveUserId) {
        return res.status(403).json({ message: "This book is reserved for someone else." });
      }
      book.holds.shift();
      book.holdStartedAt = null; 
    } else if (!book.isAvailable) {
      return res.status(400).json({ message: "Book is already checked out" });
    }

    if (user.borrowedBooks.length >= 10) return res.status(400).json({ message: "User checkout limit (10) reached." });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    book.isAvailable = false;
    book.dueDate = dueDate;
    book.borrowedBy = user._id;
    await book.save();

    user.borrowedBooks.push(book._id);
    await user.save();

    res.json({ message: `Checked out "${book.title}" for ${user.firstName}. Due: ${dueDate.toDateString()}` });
  } catch (err) {
    res.status(500).json({ message: "Checkout failed", error: err.message });
  }
};

exports.placeHold = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    const isAdmin = req.user.role === 'admin';
    const effectiveUserId = (isAdmin && req.body.targetUserId) ? req.body.targetUserId : req.user.id;

    if (!book || book.isDeleted) return res.status(404).json({ message: "Book not found" });
    if (book.isAvailable && (!book.holds || book.holds.length === 0)) {
      return res.status(400).json({ message: "Book is available for direct checkout." });
    }
    
    const alreadyWaiting = book.holds.some(holdId => holdId.toString() === effectiveUserId);
    if (alreadyWaiting) return res.status(400).json({ message: "User is already on the waitlist." });

    book.holds.push(effectiveUserId);
    await book.save();
    res.json({ message: `Hold placed. Position: ${book.holds.length}` });
  } catch (err) {
    res.status(500).json({ message: "Hold failed", error: err.message });
  }
};

exports.renewBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    const isAdmin = req.user.role === 'admin';
    
    if (!book || book.isDeleted) return res.status(404).json({ message: "Book not found" });
    
    const isBorrower = book.borrowedBy && book.borrowedBy.toString() === req.user.id;
    if (!isBorrower && !isAdmin) return res.status(403).json({ message: "Unauthorized." });
    
    if (book.holds.length > 0) return res.status(400).json({ message: "Renewal denied: Book has active holds." });

    const newDueDate = new Date(); 
    newDueDate.setDate(newDueDate.getDate() + 14);
    book.dueDate = newDueDate;
    await book.save();

    res.json({ message: `Renewed. New due date: ${newDueDate.toDateString()}` });
  } catch (err) {
    res.status(500).json({ message: "Renewal failed" });
  }
};

exports.returnBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book || (book.isAvailable && book.holds.length === 0)) {
      return res.status(400).json({ message: "Book is already in the library" });
    }

    const isAdmin = req.user.role === 'admin';
    const isBorrower = book.borrowedBy && book.borrowedBy.toString() === req.user.id;

    if (!isBorrower && !isAdmin) return res.status(403).json({ message: "Unauthorized." });

    // Important: Get user before clearing borrowedBy
    const userId = book.borrowedBy;
    book.borrowedBy = null;
    book.dueDate = null;

    if (book.holds.length > 0) {
      book.isAvailable = false;
      book.holdStartedAt = new Date(); 
    } else {
      book.isAvailable = true;
      book.holdStartedAt = null;
    }

    await book.save();

    if (userId) {
      await User.findByIdAndUpdate(userId, { 
        $pull: { borrowedBooks: req.params.id } 
      });
    }

    res.json({ message: "Return processed successfully." });
  } catch (err) {
    res.status(500).json({ message: "Return failed" });
  }
};

exports.getMyBorrowedBooks = async (req, res) => {
  try {
    const myBooks = await Book.find({ borrowedBy: req.user.id, isDeleted: false });
    res.json(myBooks);
  } catch (err) {
    res.status(500).json({ message: "Error fetching books" });
  }
};

// --- 3. ADMIN ONLY ---

exports.addBook = async (req, res) => {
  try {
    const newBook = new Book(req.body);
    await newBook.save();
    res.status(201).json(savedBook);
  } catch (err) {
    res.status(400).json({ message: "Failed to add book" });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book || book.isDeleted) return res.status(404).json({ message: "Book not found" });
    if (!book.isAvailable) return res.status(400).json({ message: "Cannot delete borrowed book." });

    book.isDeleted = true;
    await book.save();
    res.json({ message: "Book archived." });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.borrowedBooks.length > 0) {
        return res.status(400).json({ message: "Cannot delete account with active borrowings." });
    }
    
    await Book.updateMany({ holds: req.user.id }, { $pull: { holds: req.user.id } });
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: "Account deleted." });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};