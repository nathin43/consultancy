const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Create HTTP server
const httpServer = http.createServer(app);

// CORS Configuration - Production Ready
const allowedOrigins = [
  'https://manielectrical.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003'
];

// Initialize Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// CORS Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Pre-flight requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const hasAuth = req.headers.authorization ? '🔐' : '🔓';
  console.log(`[${timestamp}] ${hasAuth} ${req.method} ${req.path}`);
  next();
});

// Serve static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// Socket.IO Event Handlers
// ============================================
const ReportMessage = require('./models/ReportMessage');

io.on('connection', (socket) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}] 🔌 Socket connected: ${socket.id}`);

  // User joins their personal room to receive messages
  socket.on('joinUserRoom', (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`[${timestamp}] 👤 User ${userId} joined their room`);
    }
  });

  // Admin sends a report message to a specific user
  socket.on('sendReportMessage', async (data) => {
    try {
      const { userId, orderId, paymentId, invoiceId, title, message, status, sentBy } = data;

      // Validate required fields
      if (!userId || !title || !message || !sentBy) {
        socket.emit('reportMessageError', { 
          success: false, 
          message: 'Missing required fields: userId, title, message, or sentBy' 
        });
        return;
      }

      // Create the report message in database
      const reportMessage = await ReportMessage.create({
        userId,
        orderId: orderId || undefined,
        paymentId: paymentId || undefined,
        invoiceId: invoiceId || undefined,
        title,
        message,
        status: status || 'Info',
        sentBy,
        isRead: false
      });

      // Populate user and admin references
      await reportMessage.populate('userId', 'name email');
      await reportMessage.populate('sentBy', 'name email');

      console.log(`[${timestamp}] 📨 Report message sent to user ${userId}`);

      // Send to the specific user's room (real-time delivery)
      io.to(userId).emit('receiveReportMessage', {
        success: true,
        message: reportMessage
      });

      // Confirm to sender (admin)
      socket.emit('reportMessageSent', {
        success: true,
        message: 'Report message sent successfully',
        data: reportMessage
      });

    } catch (error) {
      console.error(`[${timestamp}] ❌ Error sending report message:`, error.message);
      socket.emit('reportMessageError', {
        success: false,
        message: error.message || 'Failed to send report message'
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`[${timestamp}] 🔌 Socket disconnected: ${socket.id}`);
  });
});

// ============================================
// REST API Routes
// ============================================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/admin-management', require('./routes/adminManagementRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/returns', require('./routes/returnRoutes'));
app.use('/api/reports', require('./routes/reportRoutes')); // Legacy reports (backward compatibility)
app.use('/api/admin/reports', require('./routes/adminReportRoutes')); // Admin reports (new)
app.use('/api/user/reports', require('./routes/userReportRoutes')); // User reports (new)
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: '🔌 Electric Shop API',
    version: '1.0.0',
    status: 'Running'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB
const mongoose = require('mongoose');
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error('❌ MONGO_URI environment variable is not defined');
  process.exit(1);
}

mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// Start Server
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

