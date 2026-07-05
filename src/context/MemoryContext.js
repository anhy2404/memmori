// src/context/MemoryContext.js - Quản lý memories/checkins
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@memorymap_memories';

// Tạo Context
const MemoryContext = createContext(null);

// Provider
export function MemoryProvider({ children }) {
  const [memories, setMemories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tải memories khi khởi động
  useEffect(() => {
    loadMemories();
  }, []);

  // Tải tất cả memories từ AsyncStorage
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

  // Lưu danh sách memories vào AsyncStorage
  async function saveMemories(list) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (error) {
      console.error('[MemoryContext] Lỗi lưu memories:', error);
      throw new Error('Lưu dữ liệu thất bại');
    }
  }

  // ===== THÊM MEMORY =====
  const addMemory = useCallback(async (memoryData) => {
    try {
      const newMemory = {
        id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: memoryData.title || '',
        description: memoryData.description || '',
        photos: memoryData.photos || [],         // mảng URI ảnh
        video: memoryData.video || null,          // URI video
        location: memoryData.location || null,    // { lat, lng, address, name }
        tags: memoryData.tags || [],              // mảng string
        userId: memoryData.userId,
        aiCaption: memoryData.aiCaption || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedList = [newMemory, ...memories];
      setMemories(updatedList);
      await saveMemories(updatedList);
      
      return { success: true, memory: newMemory };
    } catch (error) {
      console.error('[MemoryContext] Lỗi thêm memory:', error);
      throw new Error('Lưu kỷ niệm thất bại');
    }
  }, [memories]);

  // ===== XÓA MEMORY =====
  const deleteMemory = useCallback(async (memoryId) => {
    try {
      const updatedList = memories.filter(m => m.id !== memoryId);
      setMemories(updatedList);
      await saveMemories(updatedList);
      return { success: true };
    } catch (error) {
      console.error('[MemoryContext] Lỗi xóa memory:', error);
      throw new Error('Xóa kỷ niệm thất bại');
    }
  }, [memories]);

  // ===== CẬP NHẬT MEMORY =====
  const updateMemory = useCallback(async (memoryId, updates) => {
    try {
      const updatedList = memories.map(m => {
        if (m.id === memoryId) {
          return { ...m, ...updates, updatedAt: new Date().toISOString() };
        }
        return m;
      });
      setMemories(updatedList);
      await saveMemories(updatedList);
      return { success: true };
    } catch (error) {
      console.error('[MemoryContext] Lỗi cập nhật memory:', error);
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
    return memories.filter(m => m.userId === userId && m.location && m.location.lat && m.location.lng);
  }, [memories]);

  // ===== LẤY MEMORIES THEO BỘ LỌC =====
  const getFilteredMemories = useCallback((userId, filter = 'all') => {
    const userMemories = getMyMemories(userId);
    const now = new Date();
    
    switch (filter) {
      case 'today': {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return userMemories.filter(m => new Date(m.createdAt) >= todayStart);
      }
      case 'week': {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        return userMemories.filter(m => new Date(m.createdAt) >= weekStart);
      }
      case 'month': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return userMemories.filter(m => new Date(m.createdAt) >= monthStart);
      }
      default:
        return userMemories;
    }
  }, [getMyMemories]);

  // ===== THỐNG KÊ =====
  const getStats = useCallback((userId) => {
    const userMemories = getMyMemories(userId);
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const memoriesThisMonth = userMemories.filter(m => new Date(m.createdAt) >= thisMonthStart);
    const uniqueLocations = new Set(
      userMemories
        .filter(m => m.location && m.location.name)
        .map(m => m.location.name)
    ).size;

    return {
      total: userMemories.length,
      locations: uniqueLocations,
      thisMonth: memoriesThisMonth.length,
    };
  }, [getMyMemories]);

  // ===== LẤY 1 MEMORY THEO ID =====
  const getMemoryById = useCallback((memoryId) => {
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

// Custom hook
export function useMemory() {
  const context = useContext(MemoryContext);
  if (!context) {
    throw new Error('[MemoryContext] useMemory phải được dùng bên trong MemoryProvider');
  }
  return context;
}

export default MemoryContext;
