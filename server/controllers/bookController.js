const Book = require('../models/Book');
const User = require('../models/User');
const axios = require('axios');

// --- 1. GENERAL ROUTES (Public) ---

// 1. Get books with Pagination, Search, AND Category filtering
exports.getAllBooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 18; 
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';

    let query = { isDeleted: false };
    
    // Add search logic if text exists
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } }
      ];
    }

    // Add category filter if a specific genre was clicked
    if (category) {
      query.category = category;
    }

    const totalBooks = await Book.countDocuments(query);
    const totalPages = Math.ceil(totalBooks / limit);

    const books = await Book.find(query)
      .populate('borrowedBy', 'firstName lastName')
      .skip(skip)
      .limit(limit);

    res.json({ books, totalPages, currentPage: page });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Get the Default Home Page View (Grouped by Category, Max 6 per category)
exports.getGroupedBooks = async (req, res) => {
  try {
    // Find all unique categories currently in the database
    const categories = await Book.distinct("category", { isDeleted: false });
    
    const grouped = {};
    // Fetch up to 6 books for each category
    for (const cat of categories) {
       const catBooks = await Book.find({ category: cat, isDeleted: false })
         .populate('borrowedBy', 'firstName lastName')
         .limit(6);
       
       if (catBooks.length > 0) {
         grouped[cat || 'Uncategorized'] = catBooks;
       }
    }
    res.json(grouped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Get all books where the current user is next in line to pick up
exports.getMyHolds = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const targetUserId = (isAdmin && req.query.userId) ? req.query.userId : req.user.id;

    // Find ALL books where this user is ANYWHERE in the waitlist
    const pendingHolds = await Book.find({ holds: targetUserId });

    const holdsData = pendingHolds.map(book => {
      // Find out what place in line they are
      const queuePosition = book.holds.findIndex(id => id.toString() === targetUserId) + 1;
      
      let formattedDeadline = 'In Queue';

      // If they are first in line and the book is waiting on the shelf
      if (queuePosition === 1 && !book.borrowedBy && book.holdStartedAt) {
        const expiresAt = new Date(book.holdStartedAt);
        expiresAt.setHours(expiresAt.getHours() + 48);
        formattedDeadline = expiresAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
      }

      return {
        title: book.title,
        bookId: book._id,
        isbn: book.isbn,
        queuePosition: queuePosition,
        formattedDeadline: formattedDeadline
      };
    });
    
    res.json(holdsData);
  } catch (err) {
    res.status(500).json({ message: "Error fetching holds", error: err.message });
  }
};

// Search books by various fields
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
    })
    .populate('borrowedBy', 'firstName lastName') // Add this line
    .limit(20);
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
    // --- NEW: OVERDUE BLOCKING ---
    const hasOverdue = await Book.exists({
      borrowedBy: effectiveUserId,
      dueDate: { $lt: new Date() }
    });
    
    if (hasOverdue) {
      return res.status(400).json({ 
        message: "Action blocked. You have overdue items that must be returned before you can check out new books." 
      });
    }
    // -----------------------------

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
    // --- NEW: OVERDUE BLOCKING ---
    const hasOverdue = await Book.exists({
      borrowedBy: effectiveUserId,
      dueDate: { $lt: new Date() }
    });
    
    if (hasOverdue) {
      return res.status(400).json({ 
        message: "Action blocked. You have overdue items that must be returned before placing new holds." 
      });
    }
    // -----------------------------

    // --- NEW: MAX 5 HOLDS LIMIT ---
    // Count how many non-deleted books currently have this user in their holds array
    const activeHoldsCount = await Book.countDocuments({ 
      holds: effectiveUserId, 
      isDeleted: false 
    });

    if (activeHoldsCount >= 5) {
      return res.status(400).json({ 
        message: "Hold limit reached. You can only have up to 5 active holds at a time." 
      });
    }
    // ------------------------------

    if (book.borrowedBy && book.borrowedBy.toString() === effectiveUserId) {
      return res.status(400).json({ 
        message: "You currently have this book checked out. If you need it longer, please try to 'Renew' it instead." 
      });
    }

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

exports.undoHold = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    const isAdmin = req.user.role === 'admin';
    const effectiveUserId = (isAdmin && req.body.targetUserId) ? req.body.targetUserId : req.user.id;

    if (!book || book.isDeleted) return res.status(404).json({ message: "Book not found" });

    const holdIndex = book.holds.findIndex(id => id.toString() === effectiveUserId);
    if (holdIndex === -1) {
      return res.status(400).json({ message: "No active hold found for this user." });
    }

    // Remove the user from the waitlist
    book.holds.splice(holdIndex, 1);

    // If the user was first in line AND the book was sitting at the desk waiting for them
    if (holdIndex === 0 && !book.borrowedBy && !book.isAvailable) {
      if (book.holds.length > 0) {
        book.holdStartedAt = new Date(); // Pass the 48-hour window to the next person
      } else {
        book.isAvailable = true; // No one else is waiting, put it back on the shelf
        book.holdStartedAt = null;
      }
    }

    await book.save();
    res.json({ message: "Hold successfully removed." });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove hold", error: err.message });
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
    // If admin passes a userId query, use that. Otherwise, use the logged-in user.
    const isAdmin = req.user.role === 'admin';
    const targetUserId = (isAdmin && req.query.userId) ? req.query.userId : req.user.id;

    const myBooks = await Book.find({ borrowedBy: targetUserId, isDeleted: false });
    res.json(myBooks);
  } catch (err) {
    res.status(500).json({ message: "Error fetching books" });
  }
};
// --- 3. ADMIN ONLY ---

exports.addBook = async (req, res) => {
  try {
    // We no longer call Gemini here.
    // The description should come from the frontend form.
    const newBook = new Book({
      ...req.body,
      // If no description is provided, we set a default
      description: req.body.description || "No description available."
    });

    const savedBook = await newBook.save(); 
    res.status(201).json(savedBook);
  } catch (err) {
    res.status(400).json({ message: "Failed to add book", error: err.message });
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
exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book || book.isDeleted) return res.status(404).json({ message: "Book not found" });

    // Update the allowed fields
    book.title = req.body.title || book.title;
    book.author = req.body.author || book.author;
    book.category = req.body.category || book.category;
    book.isbn = req.body.isbn || book.isbn;
    book.description = req.body.description || book.description;

    await book.save();
    res.json({ message: "Book details updated successfully", book });
  } catch (err) {
    res.status(500).json({ message: "Failed to update book", error: err.message });
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

// Add this at the bottom of your bookController.js file

exports.getReports = async (req, res) => {
  try {
    // You'll need to make sure 'Book' and 'User' models are imported at the top of this file!
    const totalBooks = await Book.countDocuments();
    const totalUsers = await User.countDocuments(); // Assuming you have a User model
    
    // Count how many books are currently checked out
    // (Adjust 'status: "borrowed"' based on how your Book model tracks checkouts)
    const activeCheckouts = await Book.countDocuments({ status: "borrowed" }); 

    res.status(200).json({
      totalBooks,
      totalUsers,
      activeCheckouts
    });
  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({ message: "Error fetching reports" });
  }
};