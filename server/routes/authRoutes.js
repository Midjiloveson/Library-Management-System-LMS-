const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// DELETE /api/auth/delete-account
router.delete('/delete-account', protect, authController.deleteAccount);

// Admin search for users
router.get('/admin/search-users', protect, adminOnly, authController.adminSearchUsers);

// Admin deletes a specific user
router.delete('/admin/delete-account/:id', protect, adminOnly, authController.deleteAccount);

// User updates their own email/phone
router.put('/profile', protect, authController.updateProfile);

// Admin resets a user's password
router.put('/admin/reset-password/:id', protect, adminOnly, authController.adminResetPassword);

module.exports = router;