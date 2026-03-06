const Refund = require('../models/Refund');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const NotificationService = require('../services/notificationService');
const Admin = require('../models/Admin');

/**
 * Create refund request (User)
 * @route POST /api/refunds
 */
exports.createRefund = async (req, res) => {
  try {
    const { orderId, reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!['delivered', 'confirmed', 'shipped'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Refund can only be requested for delivered, confirmed, or shipped orders',
      });
    }

    // Check for existing refund on this order
    const existing = await Refund.findOne({ order: orderId, refundStatus: { $nin: ['rejected'] } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A refund request already exists for this order' });
    }

    const refund = await Refund.create({
      order: orderId,
      user: req.user.id,
      amount: order.totalAmount,
      reason,
    });

    // Notify admin
    try {
      const mainAdmin = await Admin.findOne({ role: 'MAIN_ADMIN' }).select('_id').lean();
      if (mainAdmin) {
        await NotificationService.notifyRefundRequest(mainAdmin._id, {
          refundId: refund._id,
          orderId: order._id,
          orderNumber: order.orderNumber,
          amount: order.totalAmount,
        });
      }
    } catch (e) {
      console.error('Refund notification error (non-fatal):', e.message);
    }

    res.status(201).json({ success: true, message: 'Refund request submitted', refund });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all refunds (Admin)
 * @route GET /api/refunds
 */
exports.getAllRefunds = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status && status !== 'all') query.refundStatus = status;

    const refunds = await Refund.find(query)
      .populate('user', 'name email phone')
      .populate('order', 'orderNumber totalAmount orderStatus')
      .populate('processedBy', 'name')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: refunds.length, refunds });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get single refund (Admin)
 * @route GET /api/refunds/:id
 */
exports.getRefundById = async (req, res) => {
  try {
    const refund = await Refund.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('order', 'orderNumber totalAmount items shippingAddress orderStatus paymentMethod')
      .populate('processedBy', 'name');

    if (!refund) {
      return res.status(404).json({ success: false, message: 'Refund not found' });
    }

    res.status(200).json({ success: true, refund });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update refund status (Admin)
 * @route PUT /api/refunds/:id
 */
exports.updateRefundStatus = async (req, res) => {
  try {
    const { refundStatus, adminNotes } = req.body;

    const refund = await Refund.findById(req.params.id);
    if (!refund) {
      return res.status(404).json({ success: false, message: 'Refund not found' });
    }

    refund.refundStatus = refundStatus;
    if (adminNotes) refund.adminNotes = adminNotes;
    refund.processedBy = req.admin._id || req.admin.id;
    refund.processedAt = new Date();

    await refund.save();

    // If approved/completed, update payment status
    if (['approved', 'completed'].includes(refundStatus)) {
      await Payment.findOneAndUpdate(
        { order: refund.order },
        { paymentStatus: 'refunded' }
      );
    }

    res.status(200).json({ success: true, message: 'Refund status updated', refund });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get user's refunds
 * @route GET /api/refunds/my
 */
exports.getMyRefunds = async (req, res) => {
  try {
    const refunds = await Refund.find({ user: req.user.id })
      .populate('order', 'orderNumber totalAmount orderStatus')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: refunds.length, refunds });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get refund stats (Admin)
 * @route GET /api/refunds/stats
 */
exports.getRefundStats = async (req, res) => {
  try {
    const refunds = await Refund.find().lean();

    const stats = {
      total: refunds.length,
      pending: 0,
      approved: 0,
      processing: 0,
      completed: 0,
      rejected: 0,
      totalRefundAmount: 0,
    };

    for (const r of refunds) {
      stats[r.refundStatus] = (stats[r.refundStatus] || 0) + 1;
      if (['approved', 'processing', 'completed'].includes(r.refundStatus)) {
        stats.totalRefundAmount += r.amount || 0;
      }
    }

    res.status(200).json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
