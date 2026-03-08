const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getCustomers,
  getCustomer,
  deleteCustomer,
  getTopBuyers,
  checkDataConsistency,
  verifyUserProfile,
  getUserAuditLog
} = require('../controllers/adminController');
const { adminProtect } = require('../middleware/auth');

/**
 * Admin Routes
 * All routes require admin authentication
 */

router.use(adminProtect); // Apply admin authentication to all routes

router.get('/dashboard', getDashboard);
router.get('/customers', getCustomers);
router.get('/customers/top-buyers', getTopBuyers);
router.get('/customers/:id', getCustomer);
router.delete('/customers/:id', deleteCustomer);

// Verification and consistency check routes
router.get('/verify/data-consistency', checkDataConsistency);
router.get('/verify/profile/:userId', verifyUserProfile);
router.get('/verify/audit/:userId', getUserAuditLog);

module.exports = router;
