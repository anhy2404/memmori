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
    // ID local dùng timestamp + random để tránh duplicate khi gọi nhanh liên tiếp
    // Các ID này chỉ dùng để render local — không gửi lên server
    const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const notif = {
      _id: localId,
      type, title, body, fromUser, targetUserId, data,
      isRead: false,
      isLocal: true, // đánh dấu để phân biệt với notif từ server
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [notif, ...prev]);
    setUnreadCount(prev => prev + 1);
    return notif;
  }, []);

  // ===== ĐỌC 1 THÔNG BÁO =====
  const markAsRead = useCallback(async (notifId) => {
    try {
      setNotifications(prev => prev.map(n =>
        (n._id || n.id) === notifId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
      // Bỏ qua local notif — không có ID thật để gửi lên server
      if (!String(notifId).startsWith('local_')) {
        await notificationsAPI.markAsRead(notifId);
      }
    } catch (err) {
      console.error('[NotificationContext] Lỗi markAsRead:', err.message);
    }
  }, []);

  // ===== ĐỌC TẤT CẢ =====
  const markAllAsRead = useCallback(async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await notificationsAPI.markAllRead();
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
      // Bỏ qua local notif
      if (!String(notifId).startsWith('local_')) {
        await notificationsAPI.delete(notifId);
      }
    } catch (err) {
      console.error('[NotificationContext] Lỗi deleteNotification:', err.message);
    }
  }, [notifications]);

  // ===== XÓA TẤT CẢ =====
  const clearAllNotifications = useCallback(async () => {
    try {
      setNotifications([]);
      setUnreadCount(0);
      await notificationsAPI.clearAll();
    } catch (err) {
      console.error('[NotificationContext] Lỗi clearAll:', err.message);
    }
  }, []);

  // ===== LẤY THÔNG BÁO (đã sort mới nhất trước) =====
  const getNotificationsForUser = useCallback(() => {
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
