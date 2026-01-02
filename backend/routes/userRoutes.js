const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updatePassword
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

/**
 * User Routes
 * All routes require authentication
 */

router.use(protect); // Apply authentication to all user routes

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/password', updatePassword);

module.exports = router;
