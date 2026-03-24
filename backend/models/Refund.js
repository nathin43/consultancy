const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  // Cancel reason selected by user during order cancellation
  cancelReason: {
    type: String,
    trim: true,
    default: null,
  },
  // Optional message sent by user to admin while requesting refund
  userMessage: {
    type: String,
    trim: true,
    default: null,
  },
  // Original payment method from order
  paymentMethod: {
    type: String,
    default: null,
  },
  // Preferred refund destination selected by customer
  refundMethod: {
    type: String,
    enum: ['original_payment_method', 'bank'],
    default: 'original_payment_method',
  },
  // Optional bank details when customer selects bank transfer
  bankDetails: {
    type: String,
    trim: true,
    default: null,
  },
  // Refund source: direct refund flow or order-cancellation flow
  source: {
    type: String,
    enum: ['order_cancellation', 'manual'],
    default: 'order_cancellation',
  },
  refundStatus: {
    type: String,
    enum: ['pending', 'approved', 'processing', 'completed', 'rejected'],
    default: 'pending',
  },
  adminNotes: {
    type: String,
    default: null,
  },
  // Reply sent by admin, visible on user order details
  adminReply: {
    type: String,
    default: null,
  },
  adminReplyAt: {
    type: Date,
    default: null,
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null,
  },
  processedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes
refundSchema.index({ order: 1 });
refundSchema.index({ user: 1, createdAt: -1 });
refundSchema.index({ refundStatus: 1, createdAt: -1 });
refundSchema.index({ source: 1, createdAt: -1 });

module.exports = mongoose.model('Refund', refundSchema);
