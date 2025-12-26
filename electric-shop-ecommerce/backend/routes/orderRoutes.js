const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  cancelOrder
} = require('../controllers/orderController');
const { protect, adminProtect } = require('../middleware/auth');

/**
 * Order Routes
 * Customer and admin order management
 */

// Admin routes (must come before /:id routes)
router.get('/', adminProtect, getAllOrders);
router.put('/:id/status', adminProtect, updateOrderStatus);

// Customer routes
router.post('/', protect, createOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/:id', protect, getOrder);
router.put('/:id/cancel', protect, cancelOrder);

module.exports = router;
