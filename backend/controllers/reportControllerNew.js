const User = require('../models/User');
const Order = require('../models/Order');

/**
 * Get all users with their report data for admin reports page
 * 
 * @route GET /api/reports/users
 * @access Private/Admin
 */
exports.getUsersForReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = {};
    
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    if (req.query.accountStatus) {
      filter.status = req.query.accountStatus;
    }

    // Get users with aggregation for order stats
    const users = await User.aggregate([
      { $match: filter },
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
          totalAmountSpent: { $sum: '$orders.totalAmount' },
          lastOrder: { $max: '$orders.createdAt' }
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          status: 1,
          totalOrders: 1,
          totalAmountSpent: 1,
          lastOrder: 1,
          createdAt: 1
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Apply additional filters after aggregation
    let filteredUsers = users;

    if (req.query.minOrders || req.query.maxOrders) {
      const minOrders = parseInt(req.query.minOrders) || 0;
      const maxOrders = parseInt(req.query.maxOrders) || Infinity;
      filteredUsers = filteredUsers.filter(
        user => user.totalOrders >= minOrders && user.totalOrders <= maxOrders
      );
    }

    if (req.query.minAmount || req.query.maxAmount) {
      const minAmount = parseFloat(req.query.minAmount) || 0;
      const maxAmount = parseFloat(req.query.maxAmount) || Infinity;
      filteredUsers = filteredUsers.filter(
        user => user.totalAmountSpent >= minAmount && user.totalAmountSpent <= maxAmount
      );
    }

    if (req.query.dateFrom || req.query.dateTo) {
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : new Date(0);
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : new Date();
      filteredUsers = filteredUsers.filter(
        user => user.lastOrder && user.lastOrder >= dateFrom && user.lastOrder <= dateTo
      );
    }

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({
      success: true,
      users: filteredUsers,
      currentPage: page,
      totalPages,
      totalUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Export users report to Excel
 * 
 * @route GET /api/reports/export/excel
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
