const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// DELETE /api/auth/delete-account
router.delete('/delete-account', protect, authController.deleteAccount);

// Admin search for users
router.get('/admin/search-users', protect, adminOnly, authController.adminSearchUsers);

module.exports = router;