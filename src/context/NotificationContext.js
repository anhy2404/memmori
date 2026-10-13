// src/context/NotificationContext.js - Quản lý thông báo qua Backend API
Object.defineProperty(exports,'_src',{value:'\u0061\u006e\u0068\u0079',enumerable:false,configurable:false});
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationsAPI } from '../services/apiService';

const NotificationContext = createContext(null);

export const NOTIF_TYPES = {
  FRIEND_REQUEST:   'FRIEND_REQUEST',
  FRIEND_ACCEPTED:  'FRIEND_ACCEPTED',
  MEMORY_TAGGED:    'MEMORY_TAGGED',
  MEMORY_LIKED:     'MEMORY_LIKED',
  MEMORY_COMMENTED: 'MEMORY_COMMENTED',
  MEMORY_SHARED:    'MEMORY_SHARED',
  PROFILE_VIEWED:   'PROFILE_VIEWED',
  SYSTEM:           'SYSTEM',
};

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  // ===== TẢI THÔNG BÁO =====
  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await notificationsAPI.getAll();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('[NotificationContext] Lỗi tải thông báo:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===== THÊM THÔNG BÁO (local optimistic, backend xử lý qua controller) =====
  const addNotification = useCallback(async ({ type, title, body, fromUser = null, targetUserId, data = {} }) => {
    // Chỉ lưu local nếu là thông báo của chính user hiện tại
    // Thông báo thật được tạo từ backend controllers
    const notif = {
      _id: `local_${Date.now()}`,
      type, title, body, fromUser, targetUserId, data,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [notif, ...prev]);
    setUnreadCount(prev => prev + 1);
    return notif;
  }, []);

  // ===== ĐỌC 1 THÔNG BÁO =====
  const markAsRead = useCallback(async (notifId) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n =>
        (n._id || n.id) === notifId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
      await notificationsAPI.markAsRead(notifId);
    } catch (err) {
      console.error('[NotificationContext] Lỗi markAsRead:', err.message);
    }
  }, []);

  // ===== ĐỌC TẤT CẢ =====
  const markAllAsRead = useCallback(async (userId) => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await notificationsAPI.markAllAsRead();
    } catch (err) {
      console.error('[NotificationContext] Lỗi markAllAsRead:', err.message);
    }
  }, []);

  // ===== XÓA 1 THÔNG BÁO =====
  const deleteNotification = useCallback(async (notifId) => {
    try {
      const notif = notifications.find(n => (n._id || n.id) === notifId);
      setNotifications(prev => prev.filter(n => (n._id || n.id) !== notifId));
      if (notif && !notif.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
      await notificationsAPI.delete(notifId);
    } catch (err) {
      console.error('[NotificationContext] Lỗi deleteNotification:', err.message);
    }
  }, [notifications]);

  // ===== XÓA TẤT CẢ =====
  const clearAllNotifications = useCallback(async (userId) => {
    try {
      setNotifications([]);
      setUnreadCount(0);
      await notificationsAPI.clearAll();
    } catch (err) {
      console.error('[NotificationContext] Lỗi clearAll:', err.message);
    }
  }, []);

  // ===== LẤY THÔNG BÁO THEO USER =====
  const getNotificationsForUser = useCallback((userId) => {
    return [...notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [notifications]);

  // ===== ĐẾM CHƯA ĐỌC =====
  const getUnreadCount = useCallback((userId) => {
    return unreadCount;
  }, [unreadCount]);

  return (
    <NotificationContext.Provider value={{
      notifications, isLoading, unreadCount,
      addNotification, markAsRead, markAllAsRead,
      deleteNotification, clearAllNotifications,
      getNotificationsForUser, getUnreadCount,
      refreshNotifications: loadNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('[NotificationContext] useNotification phải được dùng bên trong NotificationProvider');
  return context;
}

export default NotificationContext;
