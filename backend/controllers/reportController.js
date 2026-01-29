const Report = require('../models/Report');
const Order = require('../models/Order');
const User = require('../models/User');

/**
 * Report Controller
 * 
 * Handles report generation, retrieval, and management
 * Reports are automatically created when orders are placed or payments are completed
 */

/**
 * Create a report (Auto-generated)
 * Called automatically when:
 * 1. Order is placed successfully
 * 2. Payment is completed
 * 
 * @route POST /api/reports/create
 * @access Private (Internal)
 */
exports.createReport = async (req, res) => {
  try {
    const { orderId, userId, reportType = 'Order Report' } = req.body;

    // Validate input
    if (!orderId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and User ID are required'
      });
    }

    // Check if report already exists for this order
    const existingReport = await Report.findOne({ order: orderId });
    if (existingReport) {
      return res.status(200).json({
        success: true,
        message: 'Report already exists',
        report: existingReport
      });
    }

    // Fetch order details
    const order = await Order.findById(orderId).populate('user').populate('items.product');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Fetch user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prepare items data
    const reportItems = order.items.map(item => ({
      product: item.product._id,
      productName: item.product.name,
      productPrice: item.price,
      quantity: item.quantity,
      itemTotal: item.price * item.quantity
    }));

    // Create report
    const reportData = {
      user: userId,
      userName: user.name,
      userEmail: user.email,
      order: orderId,
      orderNumber: order.orderNumber || `ORD-${orderId}`,
      orderStatus: order.orderStatus,
      orderDate: order.createdAt,
      items: reportItems,
      totalAmount: order.totalAmount || order.totalPrice || 0,
      paymentMethod: order.paymentMethod || 'pending',
      transactionId: order.transactionId || null,
      paymentStatus: order.orderStatus === 'cancelled' ? 'refunded' : 'completed',
      paymentDate: order.updatedAt,
      shippingAddress: order.shippingAddress || {},
      reportType,
      reportStatus: 'Generated'
    };

    const newReport = await Report.create(reportData);

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      report: newReport
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all reports (Admin only)
 * @route GET /api/reports
 * @access Private/Admin
 */
exports.getAllReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, user, status, type, startDate, endDate } = req.query;

    // Build filter query
    const filters = {};
    if (user) filters.user = user;
    if (status) filters.reportStatus = status;
    if (type) filters.reportType = type;
    if (startDate || endDate) {
      filters.reportGeneratedAt = {};
      if (startDate) filters.reportGeneratedAt.$gte = new Date(startDate);
      if (endDate) filters.reportGeneratedAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const reports = await Report.find(filters)
      .populate('user', 'name email phone')
      .populate('order', 'orderNumber orderStatus')
      .sort({ reportGeneratedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalReports = await Report.countDocuments(filters);

    res.status(200).json({
      success: true,
      count: reports.length,
      totalReports,
      totalPages: Math.ceil(totalReports / limit),
      currentPage: parseInt(page),
      reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get user's reports (User can only see their own)
 * @route GET /api/reports/user/:userId
 * @access Private/User
 */
exports.getUserReports = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status, type, startDate, endDate } = req.query;

    // Verify user is accessing their own reports or is admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own reports'
      });
    }

    // Build filter query
    const filters = { user: userId };
    if (status) filters.reportStatus = status;
    if (type) filters.reportType = type;
    if (startDate || endDate) {
      filters.reportGeneratedAt = {};
      if (startDate) filters.reportGeneratedAt.$gte = new Date(startDate);
      if (endDate) filters.reportGeneratedAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const reports = await Report.find(filters)
      .populate('order', 'orderNumber orderStatus')
      .sort({ reportGeneratedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalReports = await Report.countDocuments(filters);

    res.status(200).json({
      success: true,
      count: reports.length,
      totalReports,
      totalPages: Math.ceil(totalReports / limit),
      currentPage: parseInt(page),
      reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get single report details
 * @route GET /api/reports/:reportId
 * @access Private
 */
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId)
      .populate('user', 'name email phone address city state zipCode')
      .populate('order')
      .populate('items.product', 'name description');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check access: user can only see their own reports
    if (req.user.id !== report.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this report'
      });
    }

    res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Download report (increments download count)
 * @route PUT /api/reports/:reportId/download
 * @access Private
 */
exports.downloadReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check access
    if (req.user.id !== report.user.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to download this report'
      });
    }

    // Update download info
    report.reportStatus = 'Downloaded';
    report.lastDownloadedAt = new Date();
    report.downloadCount += 1;
    await report.save();

    res.status(200).json({
      success: true,
      message: 'Report download recorded',
      report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Generate report for specific order
 * @route POST /api/reports/generate/:orderId
 * @access Private/User
 */
exports.generateReportForOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Fetch order
    const order = await Order.findById(orderId).populate('user');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // User can only generate reports for their own orders
    if (req.user.id !== order.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only generate reports for your own orders'
      });
    }

    // Check if report already exists
    let report = await Report.findOne({ order: orderId });
    if (!report) {
      // Create new report
      report = await exports.createReport({
        body: {
          orderId: orderId,
          userId: req.user.id,
          reportType: 'Invoice'
        }
      }, res);
    }

    res.status(200).json({
      success: true,
      message: 'Report ready for download',
      report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get report statistics (Admin only)
 * @route GET /api/reports/stats/dashboard
 * @access Private/Admin
 */
exports.getReportStats = async (req, res) => {
  try {
    const totalReports = await Report.countDocuments();
    const generatedReports = await Report.countDocuments({ reportStatus: 'Generated' });
    const downloadedReports = await Report.countDocuments({ reportStatus: 'Downloaded' });
    const totalDownloads = await Report.aggregate([
      {
        $group: {
          _id: null,
          totalDownloads: { $sum: '$downloadCount' }
        }
      }
    ]);

    const reportsThisMonth = await Report.countDocuments({
      reportGeneratedAt: {
        $gte: new Date(new Date().setDate(1)),
        $lte: new Date()
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalReports,
        generated: generatedReports,
        downloaded: downloadedReports,
        downloaded_total: totalDownloads[0]?.totalDownloads || 0,
        thisMonth: reportsThisMonth
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
