const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

/**
 * Cart Routes
 * Public routes for cart browsing (without auth)
 * Protected routes for authenticated users
 */

// Routes that work with optional authentication (localStorage backup)
router.get('/', (req, res, next) => {
  // If user is authenticated, use protected route; otherwise allow guest cart
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
}, getCart);

router.post('/add', addToCart);
router.put('/update', updateCartItem);
router.delete('/remove/:productId', removeFromCart);
router.delete('/clear', clearCart);

module.exports = router;
