import React, { createContext, useState, useContext, useEffect } from 'react';
import { notificationAPI } from '../api/watchlistApi';
import { toast } from 'react-toastify';
import socket from '../utils/socket'; // Import WebSocket

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // WebSocket connection status
  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      console.log('✅ WebSocket connected for real-time notifications');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('❌ WebSocket disconnected');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  // Real-time notification listener
  useEffect(() => {
    const handleNewNotification = (notification) => {
      console.log('📨 Real-time notification received:', notification);
      
      // Add new notification to the top
      setNotifications(prev => [notification, ...prev]);
      
      // Increment unread count
      if (!notification.read) {
        setUnreadCount(prev => prev + 1);
      }
      
      // Show toast for important notifications
      if (notification.priority === 'high') {
        toast.info(notification.message, {
          position: "top-right",
          autoClose: 5000,
        });
      }
    };

    const handlePriceAlert = (alert) => {
      console.log('💰 Real-time price alert:', alert);
      
      const notification = {
        _id: `price-alert-${Date.now()}`,
        title: 'Price Alert Triggered',
        message: `${alert.symbol} ${alert.condition} $${alert.target_price}`,
        type: 'warning',
        read: false,
        created_at: new Date().toISOString(),
        priority: 'high'
      };
      
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast for price alerts
      toast.warning(`💰 ${alert.symbol} ${alert.condition} $${alert.target_price}`, {
        position: "top-right",
        autoClose: 4000,
      });
    };

    // Listen for real-time events
    socket.on('new_notification', handleNewNotification);
    socket.on('price_alert', handlePriceAlert);
    socket.on('notification_update', handleNewNotification);

    // Cleanup
    return () => {
      socket.off('new_notification', handleNewNotification);
      socket.off('price_alert', handlePriceAlert);
      socket.off('notification_update', handleNewNotification);
    };
  }, []);

  const fetchNotifications = async (unreadOnly = false) => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications(unreadOnly);
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to load notifications');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      if (response.data.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await notificationAPI.markAsRead(notificationId);
      if (response.data.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to mark notification as read');
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(notif => !notif.read);
      for (const notif of unreadNotifications) {
        await markAsRead(notif._id);
      }
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to mark all notifications as read');
      }
    }
  };

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  };

  // Initialize notifications and set up polling
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Poll for updates every 30 seconds (fallback if WebSocket fails)
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    isConnected, // WebSocket connection status
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    addNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};