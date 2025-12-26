const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  getFeaturedProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { adminProtect } = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * Product Routes
 * Public routes for viewing products
 * Admin routes for managing products
 */

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/categories', getCategories);
router.get('/:id', getProduct);

// Admin routes
router.post('/', adminProtect, upload.single('image'), createProduct);
router.put('/:id', adminProtect, upload.single('image'), updateProduct);
router.delete('/:id', adminProtect, deleteProduct);

module.exports = router;
