const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Mock products for when database is unavailable
const MOCK_PRODUCTS = {
  '1': { _id: '1', name: 'Wireless Headphones', price: 99.99, stock: 50 },
  '2': { _id: '2', name: 'USB-C Cable', price: 12.99, stock: 100 },
  '3': { _id: '3', name: 'Screen Protector', price: 9.99, stock: 150 },
  '4': { _id: '4', name: 'Phone Case', price: 19.99, stock: 75 }
};

/**
 * Get user's cart (or guest cart from body)
 * @route GET /api/cart
 * @access Public/Private
 */
exports.getCart = async (req, res) => {
  try {
    // If user is authenticated, get from database
    if (req.user) {
      try {
        let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

        if (!cart) {
          // Create empty cart if doesn't exist
          cart = await Cart.create({
            user: req.user.id,
            items: [],
            totalAmount: 0
          });
        }

        return res.status(200).json({
          success: true,
          cart,
          source: 'database'
        });
      } catch (dbError) {
        console.warn('Database query failed for cart:', dbError.message);
      }
    }

    // For guest users or when database is unavailable, cart is managed on frontend
    res.status(200).json({
      success: true,
      message: 'Cart managed on client side',
      source: 'localStorage',
      cart: { items: [], totalAmount: 0 }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Add item to cart
 * @route POST /api/cart/add
 * @access Public/Private
 */
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // If user is authenticated, use database
    if (req.user) {
      try {
        // Validate product
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: 'Product not found'
          });
        }

        // Check stock
        if (product.stock < quantity) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient stock'
          });
        }

        // Find or create cart
        let cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
          cart = await Cart.create({
            user: req.user.id,
            items: [],
            totalAmount: 0
          });
        }

        // Check if product already in cart
        const existingItemIndex = cart.items.findIndex(
          item => item.product.toString() === productId
        );

        if (existingItemIndex > -1) {
          // Update quantity
          cart.items[existingItemIndex].quantity += quantity;
        } else {
          // Add new item
          cart.items.push({
            product: productId,
            quantity,
            price: product.price
          });
        }

        await cart.save();
        await cart.populate('items.product');

        return res.status(200).json({
          success: true,
          message: 'Item added to cart',
          cart,
          source: 'database'
        });
      } catch (dbError) {
        console.warn('Database operation failed for add to cart:', dbError.message);
      }
    }

    // For guest users or when database is unavailable, validate against mock data
    const product = MOCK_PRODUCTS[productId];
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Item added to cart (client-side)',
      source: 'localStorage',
      product: { ...product, quantity }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update cart item quantity
 * @route PUT /api/cart/update
 * @access Public/Private
 */
exports.updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // If user is authenticated, use database
    if (req.user) {
      try {
        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
          return res.status(404).json({
            success: false,
            message: 'Cart not found'
          });
        }

        const itemIndex = cart.items.findIndex(
          item => item.product.toString() === productId
        );

        if (itemIndex === -1) {
          return res.status(404).json({
            success: false,
            message: 'Item not found in cart'
          });
        }

        // Validate stock
        const product = await Product.findById(productId);
        if (product.stock < quantity) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient stock'
          });
        }

        cart.items[itemIndex].quantity = quantity;
        await cart.save();
        await cart.populate('items.product');

        return res.status(200).json({
          success: true,
          message: 'Cart updated',
          cart,
          source: 'database'
        });
      } catch (dbError) {
        console.warn('Database operation failed for update cart:', dbError.message);
      }
    }

    // For guest users or when database is unavailable
    const product = MOCK_PRODUCTS[productId];
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cart item updated (client-side)',
      source: 'localStorage',
      product: { ...product, quantity }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Remove item from cart
 * @route DELETE /api/cart/remove/:productId
 * @access Public/Private
 */
exports.removeFromCart = async (req, res) => {
  try {
    // If user is authenticated, use database
    if (req.user) {
      try {
        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
          return res.status(404).json({
            success: false,
            message: 'Cart not found'
          });
        }

        cart.items = cart.items.filter(
          item => item.product.toString() !== req.params.productId
        );

        await cart.save();
        await cart.populate('items.product');

        return res.status(200).json({
          success: true,
          message: 'Item removed from cart',
          cart,
          source: 'database'
        });
      } catch (dbError) {
        console.warn('Database operation failed for remove from cart:', dbError.message);
      }
    }

    // For guest users or when database is unavailable
    res.status(200).json({
      success: true,
      message: 'Item removed from cart (client-side)',
      source: 'localStorage',
      productId: req.params.productId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Clear cart
 * @route DELETE /api/cart/clear
 * @access Public/Private
 */
exports.clearCart = async (req, res) => {
  try {
    // If user is authenticated, use database
    if (req.user) {
      try {
        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
          return res.status(404).json({
            success: false,
            message: 'Cart not found'
          });
        }

        cart.items = [];
        cart.totalAmount = 0;
        await cart.save();

        return res.status(200).json({
          success: true,
          message: 'Cart cleared',
          cart,
          source: 'database'
        });
      } catch (dbError) {
        console.warn('Database operation failed for clear cart:', dbError.message);
      }
    }

    // For guest users or when database is unavailable
    res.status(200).json({
      success: true,
      message: 'Cart cleared (client-side)',
      source: 'localStorage'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
