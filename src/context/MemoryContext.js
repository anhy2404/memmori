// src/context/MemoryContext.js - Quản lý memories/checkins
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@memorymap_memories';

const MemoryContext = createContext(null);

export function MemoryProvider({ children }) {
  const [memories, setMemories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // Ref để tránh race condition khi refresh đồng thời
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef(null);

  useEffect(() => {
    loadMemories();
  }, []);

  async function loadMemories() {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setMemories(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('[MemoryContext] Lỗi tải memories:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Lưu với debounce để tránh ghi đè khi nhiều thao tác nhanh
  async function saveMemories(list) {
    if (isSavingRef.current) {
      // Nếu đang lưu, ghi nhớ list mới nhất để lưu sau
      pendingSaveRef.current = list;
      return;
    }
    isSavingRef.current = true;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      // Nếu có pending save, thực hiện ngay
      if (pendingSaveRef.current) {
        const pending = pendingSaveRef.current;
        pendingSaveRef.current = null;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
      }
    } catch (error) {
      console.error('[MemoryContext] Lỗi lưu memories:', error);
      throw new Error('Lưu dữ liệu thất bại');
    } finally {
      isSavingRef.current = false;
    }
  }

  // ===== THÊM MEMORY =====
  const addMemory = useCallback(async (memoryData) => {
    const newMemory = {
      id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: memoryData.title || '',
      description: memoryData.description || '',
      photos: Array.isArray(memoryData.photos) ? memoryData.photos : [],
      video: memoryData.video || null,
      location: memoryData.location || null,
      tags: Array.isArray(memoryData.tags) ? memoryData.tags : [],
      userId: memoryData.userId || null,
      aiCaption: memoryData.aiCaption || '',
      privacy: memoryData.privacy || 'private',
      taggedUsers: Array.isArray(memoryData.taggedUsers) ? memoryData.taggedUsers : [],
      ownerName: memoryData.ownerName || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Tính updatedList trước khi setState để tránh async trong setState updater
    const updatedList = [newMemory, ...memories];
    try {
      await saveMemories(updatedList);
      setMemories(updatedList);
      return { success: true, memory: newMemory };
    } catch (err) {
      console.error('[MemoryContext] Lỗi lưu sau addMemory:', err);
      throw new Error('Lưu kỷ niệm thất bại - kiểm tra bộ nhớ thiết bị');
    }
  }, [memories]);

  // ===== XÓA MEMORY =====
  const deleteMemory = useCallback(async (memoryId) => {
    const updatedList = memories.filter(m => m.id !== memoryId);
    try {
      await saveMemories(updatedList);
      setMemories(updatedList);
      return { success: true };
    } catch (err) {
      console.error('[MemoryContext] Lỗi lưu sau deleteMemory:', err);
      throw new Error('Xóa kỷ niệm thất bại');
    }
  }, [memories]);

  // ===== CẬP NHẬT MEMORY =====
  const updateMemory = useCallback(async (memoryId, updates) => {
    // Loại bỏ các field không được phép update trực tiếp
    const { id: _id, userId: _uid, createdAt: _ca, ...safeUpdates } = updates;
    const updatedList = memories.map(m =>
      m.id === memoryId
        ? { ...m, ...safeUpdates, updatedAt: new Date().toISOString() }
        : m
    );
    try {
      await saveMemories(updatedList);
      setMemories(updatedList);
      return { success: true };
    } catch (err) {
      console.error('[MemoryContext] Lỗi lưu sau updateMemory:', err);
      throw new Error('Cập nhật kỷ niệm thất bại');
    }
  }, [memories]);

  // ===== LẤY MEMORIES THEO USER =====
  const getMyMemories = useCallback((userId) => {
    if (!userId) return [];
    return memories.filter(m => m.userId === userId);
  }, [memories]);

  // ===== LẤY MEMORIES CÓ VỊ TRÍ =====
  const getMemoriesWithLocation = useCallback((userId) => {
    if (!userId) return [];
    return memories.filter(
      m => m.userId === userId &&
      m.location?.lat != null &&
      m.location?.lng != null
    );
  }, [memories]);

  // ===== LẤY MEMORIES THEO BỘ LỌC =====
  const getFilteredMemories = useCallback((userId, filter = 'all') => {
    if (!userId) return [];
    // Hiện: memories của mình (mọi privacy) + memories public của người khác
    const visibleMemories = memories.filter(m =>
      m.userId === userId || m.privacy === 'public'
    );
    if (filter === 'all') return visibleMemories;

    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'today':
        return visibleMemories.filter(m => new Date(m.createdAt) >= todayStart);
      case 'week': {
        const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
        return visibleMemories.filter(m => new Date(m.createdAt).getTime() >= weekAgo);
      }
      case 'month': {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        return visibleMemories.filter(m => new Date(m.createdAt) >= monthStart);
      }
      default:
        return visibleMemories;
    }
  }, [memories]);

  // ===== THỐNG KÊ =====
  const getStats = useCallback((userId) => {
    if (!userId) return { total: 0, locations: 0, thisMonth: 0 };
    const userMemories = memories.filter(m => m.userId === userId);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const thisMonth = userMemories.filter(m => new Date(m.createdAt) >= monthStart).length;
    const uniqueLocations = new Set(
      userMemories
        .filter(m => m.location?.name)
        .map(m => m.location.name)
    ).size;

    return { total: userMemories.length, locations: uniqueLocations, thisMonth };
  }, [memories]);

  // ===== LẤY 1 MEMORY THEO ID =====
  const getMemoryById = useCallback((memoryId) => {
    if (!memoryId) return null;
    return memories.find(m => m.id === memoryId) || null;
  }, [memories]);

  const contextValue = {
    memories,
    isLoading,
    addMemory,
    deleteMemory,
    updateMemory,
    getMyMemories,
    getMemoriesWithLocation,
    getFilteredMemories,
    getStats,
    getMemoryById,
    refreshMemories: loadMemories,
  };

  return (
    <MemoryContext.Provider value={contextValue}>
      {children}
    </MemoryContext.Provider>
  );
}

export function useMemory() {
  const context = useContext(MemoryContext);
  if (!context) {
    throw new Error('[MemoryContext] useMemory phải được dùng bên trong MemoryProvider');
  }
  return context;
}

export default MemoryContext;
