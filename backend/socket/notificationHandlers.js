/**
 * Socket.IO Notification Handlers
 * Real-time notification events
 */

const Notification = require('../models/Notification');
const NotificationService = require('../services/notificationService');

module.exports = (io) => {
  // Store admin socket connections
  const adminSockets = {};

  io.on('connection', (socket) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`[${timestamp}] 📬 Notification socket connected: ${socket.id}`);

    // Admin joins notification room
    socket.on('notification:admin-join', (adminId) => {
      if (adminId) {
        socket.join(`admin:${adminId}`);
        adminSockets[adminId] = socket.id;
        console.log(`[${timestamp}] 👨‍💼 Admin ${adminId} joined notification room`);
      }
    });

    // Request to sync notifications
    socket.on('notification:sync', async (adminId) => {
      try {
        const notifications = await NotificationService.getAllNotifications(adminId, 50, 0);
        const unreadCount = await NotificationService.getUnreadCount(adminId);

        socket.emit('notification:sync-response', {
          success: true,
          notifications: notifications.notifications,
          unreadCount,
          total: notifications.total,
        });
      } catch (error) {
        console.error(`[${timestamp}] ❌ Sync error:`, error.message);
        socket.emit('notification:sync-error', {
          success: false,
          message: error.message,
        });
      }
    });

    // Listen for mark as read
    socket.on('notification:mark-read', async (data) => {
      try {
        const { notificationId, adminId } = data;
        await NotificationService.markAsRead(adminId, notificationId);

        // Broadcast to admin's sockets
        io.to(`admin:${adminId}`).emit('notification:marked-read', {
          notificationId,
        });
      } catch (error) {
        console.error(`[${timestamp}] ❌ Mark read error:`, error.message);
      }
    });

    // Listen for mark all as read
    socket.on('notification:mark-all-read', async (adminId) => {
      try {
        await NotificationService.markAllAsRead(adminId);

        // Broadcast to admin's sockets
        io.to(`admin:${adminId}`).emit('notification:all-marked-read');
      } catch (error) {
        console.error(`[${timestamp}] ❌ Mark all read error:`, error.message);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      // Remove from adminSockets
      for (const adminId in adminSockets) {
        if (adminSockets[adminId] === socket.id) {
          delete adminSockets[adminId];
          console.log(`[${timestamp}] 👨‍💼 Admin ${adminId} left notification room`);
        }
      }
      console.log(`[${timestamp}] 📬 Notification socket disconnected: ${socket.id}`);
    });
  });

  /**
   * Emit notification to specific admin
   */
  const emitToAdmin = (adminId, notification) => {
    io.to(`admin:${adminId}`).emit('notification:new', notification);
  };

  /**
   * Emit batch notifications to admin
   */
  const emitBatchToAdmin = (adminId, notifications) => {
    io.to(`admin:${adminId}`).emit('notification:batch', notifications);
  };

  /**
   * Emit unread count update to admin
   */
  const emitUnreadCountUpdate = (adminId, unreadCount) => {
    io.to(`admin:${adminId}`).emit('notification:unread-count', {
      unreadCount,
    });
  };

  /**
   * Emit to all connected admins (broadcast)
   */
  const broadcastToAllAdmins = (notification) => {
    io.emit('notification:broadcast', notification);
  };

  return {
    emitToAdmin,
    emitBatchToAdmin,
    emitUnreadCountUpdate,
    broadcastToAllAdmins,
  };
};
