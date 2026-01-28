const mongoose = require('mongoose');

/**
 * Report Schema
 * Stores generated reports linked to users, orders, and payments
 * Reports are auto-generated when orders are placed or payments are completed
 */
const reportSchema = new mongoose.Schema({
  // User Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },

  // Order Information
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  orderNumber: {
    type: String,
    required: true
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  orderDate: {
    type: Date,
    required: true
  },

  // Order Items Details
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: String,
    productPrice: Number,
    quantity: Number,
    itemTotal: Number
  }],

  // Amount Details
  subtotal: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },

  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'upi', 'net_banking', 'wallet', 'cod'],
    required: true
  },
  transactionId: {
    type: String,
    default: null
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    required: true
  },
  paymentDate: {
    type: Date,
    default: null
  },

  // Shipping Information
  shippingAddress: {
    fullName: String,
    phone: String,
    email: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },

  // Report Metadata
  reportType: {
    type: String,
    enum: ['Order Report', 'Payment Report', 'Invoice'],
    default: 'Order Report'
  },
  reportStatus: {
    type: String,
    enum: ['Generated', 'Downloaded', 'Archived'],
    default: 'Generated'
  },
  reportGeneratedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastDownloadedAt: {
    type: Date,
    default: null
  },
  downloadCount: {
    type: Number,
    default: 0
  },

  // Notes & Additional Info
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
reportSchema.index({ user: 1, reportGeneratedAt: -1 });
reportSchema.index({ order: 1 });
reportSchema.index({ paymentStatus: 1 });
reportSchema.index({ reportType: 1 });

// Middleware to populate related data
reportSchema.pre(/^find/, function(next) {
  if (this.options._recursed) {
    return next();
  }
  
  this.populate({
    path: 'user',
    select: 'name email phone'
  }).populate({
    path: 'order',
    select: '_id orderNumber orderStatus'
  });
  
  next();
});

module.exports = mongoose.model('Report', reportSchema);
