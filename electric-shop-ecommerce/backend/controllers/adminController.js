const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * Get admin dashboard statistics
 * @route GET /api/admin/dashboard
 * @access Private/Admin
 */
exports.getDashboard = async (req, res) => {
  try {
    // Total products
    const totalProducts = await Product.countDocuments();
    
    // Total orders
    const totalOrders = await Order.countDocuments();
    
    // Total customers
    const totalCustomers = await User.countDocuments();
    
    // Total sales
    const orders = await Order.find({ orderStatus: { $ne: 'cancelled' } });
    const totalSales = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    
    // Pending orders
    const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
    
    // Out of stock products
    const outOfStock = await Product.countDocuments({ stock: 0 });
    
    // Recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort('-createdAt')
      .limit(5);
    
    // Sales by category
    const products = await Product.find();
    const categorySales = {};
    
    for (let order of orders) {
      for (let item of order.items) {
        const product = products.find(p => p._id.toString() === item.product.toString());
        if (product) {
          if (!categorySales[product.category]) {
            categorySales[product.category] = 0;
          }
          categorySales[product.category] += item.price * item.quantity;
        }
      }
    }

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        totalOrders,
        totalCustomers,
        totalSales,
        pendingOrders,
        outOfStock
      },
      recentOrders,
      categorySales
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all customers
 * @route GET /api/admin/customers
 * @access Private/Admin
 */
exports.getCustomers = async (req, res) => {
  try {
    const customers = await User.find().select('-password').sort('-createdAt');

    res.status(200).json({
      success: true,
      count: customers.length,
      customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get customer details with orders
 * @route GET /api/admin/customers/:id
 * @access Private/Admin
 */
exports.getCustomer = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id).select('-password');
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const orders = await Order.find({ user: req.params.id })
      .populate('items.product')
      .sort('-createdAt');

    const totalSpent = orders.reduce((sum, order) => sum + order.totalPrice, 0);

    res.status(200).json({
      success: true,
      customer,
      orders,
      totalOrders: orders.length,
      totalSpent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete customer
 * @route DELETE /api/admin/customers/:id
 * @access Private/Admin
 */
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    await customer.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
