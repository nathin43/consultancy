const User = require('../models/User');
const Order = require('../models/Order');
const Review = require('../models/Review');

/**
 * Admin Report Controller
 * Handles all admin-side reporting functionality
 * Admins can view reports for ANY user
 */

/**
 * Get all users for admin reports page
 * Includes pagination, filters, search
 * 
 * @route GET /api/admin/reports/users
 * @access Private/Admin
 */
exports.getUsersForReports = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      search = '',
      accountStatus = '',
      dateFrom = '',
      dateTo = '',
      minOrders = '',
      maxOrders = '',
      minAmount = '',
      maxAmount = ''
    } = req.query;

    // Build filter query
    const filters = {};

    // Search by name or email
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by account status
    if (accountStatus) {
      filters.accountStatus = accountStatus;
    }

    // Filter by registration date
    if (dateFrom || dateTo) {
      filters.createdAt = {};
      if (dateFrom) filters.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filters.createdAt.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;

    // Get users with aggregated order data
    const usersAggregation = await User.aggregate([
      { $match: filters },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'orders'
        }
      },
      {
        $addFields: {
          totalOrders: { $size: '$orders' },
          totalAmountSpent: {
            $sum: {
              $map: {
                input: '$orders',
                as: 'order',
                in: { $ifNull: ['$$order.totalAmount', '$$order.totalPrice', 0] }
              }
            }
          },
          lastOrder: { $max: '$orders.createdAt' }
        }
      },
      {
        $match: {
          ...(minOrders && { totalOrders: { $gte: parseInt(minOrders) } }),
          ...(maxOrders && { totalOrders: { $lte: parseInt(maxOrders) } }),
          ...(minAmount && { totalAmountSpent: { $gte: parseFloat(minAmount) } }),
          ...(maxAmount && { totalAmountSpent: { $lte: parseFloat(maxAmount) } })
        }
      },
      {
        $project: {
          password: 0,
          orders: 0
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    const totalUsers = await User.countDocuments(filters);

    res.status(200).json({
      success: true,
      users: usersAggregation,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers
    });
  } catch (error) {
    console.error('Error fetching users for reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

/**
 * Get comprehensive report for a specific user (Admin only)
 * Fetches user details, orders, payments, invoices, reviews
 * 
 * @route GET /api/admin/reports/user/:userId
 * @access Private/Admin
 */
exports.getUserFullReport = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Fetch user details
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Fetch all orders for this user
    const orders = await Order.find({ user: userId })
      .populate('items.product', 'name price images')
      .sort({ createdAt: -1 });

    // Fetch all reviews by this user
    const reviews = await Review.find({ user: userId })
      .populate('product', 'name images')
      .sort({ createdAt: -1 });

    // Prepare response data
    const responseData = {
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        accountStatus: user.accountStatus,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        addresses: user.addresses || []
      },
      orders: orders.map(order => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        items: order.items,
        totalAmount: order.totalAmount || order.totalPrice,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        deliveredAt: order.deliveredAt
      })),
      reviews: reviews.map(review => ({
        _id: review._id,
        product: review.product,
        rating: review.rating,
        comment: review.comment,
        status: review.status,
        createdAt: review.createdAt
      })),
      summary: {
        totalOrders: orders.length,
        totalSpent: orders.reduce((sum, order) => sum + (order.totalAmount || order.totalPrice || 0), 0),
        totalReviews: reviews.length,
        deliveredOrders: orders.filter(o => o.orderStatus === 'delivered').length,
        pendingOrders: orders.filter(o => o.orderStatus === 'pending').length,
        cancelledOrders: orders.filter(o => o.orderStatus === 'cancelled').length
      }
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching user full report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user report data',
      error: error.message
    });
  }
};

/**
 * Export users report to Excel
 * 
 * @route GET /api/admin/reports/export/excel
 * @access Private/Admin
 */
exports.exportUsersExcel = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Excel export functionality - To be implemented with exceljs library'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
