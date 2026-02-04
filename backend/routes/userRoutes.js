const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updatePassword,
  getUserById
} = require('../controllers/userController');
const { protect, adminProtect } = require('../middleware/auth');

/**
 * User Routes
 * Customer routes require protect, admin routes require adminProtect
 */

// Admin route to get user by ID (must come first, before protect middleware)
router.get('/:userId', adminProtect, getUserById);

// Customer routes (require authentication)
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);

module.exports = router;
