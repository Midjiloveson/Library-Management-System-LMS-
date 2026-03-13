const User = require('../models/User');
const Book = require('../models/Book');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register a new user
exports.register = async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    user = new User({ firstName, lastName, email, phone, password });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid Credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET || 'your_fallback_secret', 
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: { id: user._id, firstName: user.firstName, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete account logic
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Block if they have books
    if (user.borrowedBooks && user.borrowedBooks.length > 0) {
      return res.status(400).json({ 
        message: "Account cannot be deleted. You must return all borrowed books first!" 
      });
    }

    // 2. Cleanup Hold Queue
    await Book.updateMany(
      { holds: req.user.id },
      { $pull: { holds: req.user.id } }
    );

    // 3. Delete User
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: "Account deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Admin only: Search for users by name, email, or phone
exports.adminSearchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: "Search query required" });

    const users = await User.find({
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ]
    }).select('-password');

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "User search failed", error: err.message });
  }
};