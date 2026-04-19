const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// GET  /api/auth/profile — fetch MongoDB profile for logged-in Firebase user
router.get('/profile', protect, authController.getProfile);

// POST /api/auth/profile — sync name/phone after Firebase sign-up
router.post('/profile', protect, authController.syncProfile);

// DELETE /api/auth/delete-account
router.delete('/delete-account', protect, authController.deleteAccount);

// GET /api/auth/admin/search-users
router.get('/admin/search-users', protect, adminOnly, authController.adminSearchUsers);

module.exports = router;
