/* @refresh reset */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import API from '../services/api';

export const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: 'all', type: 'all' });

  // Fetch all notifications
  const fetchNotifications = useCallback(async (limit = 50, skip = 0) => {
    try {
      setLoading(true);
      const response = await API.get(`/admin/notifications`, {
        params: { limit, skip },
      });

      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch unread notifications only
  const fetchUnreadNotifications = useCallback(async (limit = 50) => {
    try {
      const response = await API.get(`/admin/notifications/unread`, {
        params: { limit },
      });

      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
    }
  }, []);

  // Get unread count only
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await API.get(`/admin/notifications/count`);

      if (response.data.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await API.put(`/admin/notifications/${notificationId}/read`);

      if (response.data.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await API.put(`/admin/notifications/mark-all-read`);

      if (response.data.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const response = await API.delete(`/admin/notifications/${notificationId}`);

      if (response.data.success) {
        // Update local state
        setNotifications((prev) =>
          prev.filter((notif) => notif._id !== notificationId)
        );
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      const response = await API.delete(`/admin/notifications`);

      if (response.data.success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, []);

  // Add notification (for real-time via WebSocket)
  const addNotification = useCallback((notification) => {
    setNotifications((prev) => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  // Fetch filtered notifications
  const fetchFilteredNotifications = useCallback(
    async (status = 'all', type = 'all', limit = 50, skip = 0) => {
      try {
        setLoading(true);
        const response = await API.get(`/admin/notifications/filter`, {
          params: { status, type, limit, skip },
        });

        if (response.data.success) {
          setNotifications(response.data.notifications);
          setUnreadCount(response.data.unreadCount);
          setFilters({ status, type });
        }
      } catch (error) {
        console.error('Error fetching filtered notifications:', error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Update status filter
  const setStatusFilter = useCallback(
    async (status) => {
      setFilters((prev) => ({ ...prev, status }));
      await fetchFilteredNotifications(status, filters.type);
    },
    [filters.type, fetchFilteredNotifications]
  );

  // Update type filter
  const setTypeFilter = useCallback(
    async (type) => {
      setFilters((prev) => ({ ...prev, type }));
      await fetchFilteredNotifications(filters.status, type);
    },
    [filters.status, fetchFilteredNotifications]
  );

  // Reset filters
  const resetFilters = useCallback(async () => {
    setFilters({ status: 'all', type: 'all' });
    await fetchNotifications();
  }, [fetchNotifications]);

  // Initialize on mount
  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    loading,
    filters,
    fetchNotifications,
    fetchUnreadNotifications,
    fetchUnreadCount,
    fetchFilteredNotifications,
    setStatusFilter,
    setTypeFilter,
    resetFilters,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    addNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
