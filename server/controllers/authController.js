const User = require('../models/User');
const Book = require('../models/Book');

// GET /api/auth/profile — returns the authenticated user's MongoDB profile
exports.getProfile = async (req, res) => {
  res.json(req.user);
};

// POST /api/auth/profile — create/update profile fields after Firebase sign-up
exports.syncProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, phone },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Profile sync failed', error: err.message });
  }
};

// DELETE /api/auth/delete-account
exports.deleteAccount = async (req, res) => {
  try {
    const user = req.user;
    if (user.borrowedBooks && user.borrowedBooks.length > 0) {
      return res.status(400).json({
        message: 'Account cannot be deleted. You must return all borrowed books first!'
      });
    }

    await Book.updateMany(
      { holds: user._id },
      { $pull: { holds: user._id } }
    );

    await User.findByIdAndDelete(user._id);
    res.json({ message: 'Account deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/auth/admin/search-users — admin only: search patrons by name/email/phone
exports.adminSearchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: 'Search query required' });

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
    res.status(500).json({ message: 'User search failed', error: err.message });
  }
};
