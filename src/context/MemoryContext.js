// src/context/MemoryContext.js - Quản lý memories qua Backend API
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { memoryAPI } from '../services/apiService';

const MemoryContext = createContext(null);

export function MemoryProvider({ children }) {
  const [memories, setMemories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMemories();
  }, []);

  // ===== TẢI MEMORIES =====
  const loadMemories = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await memoryAPI.getMyMemories(1, 'all');
      if (data.success) {
        setMemories(data.memories || []);
      }
    } catch (err) {
      console.error('[MemoryContext] Lỗi tải memories:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===== THÊM MEMORY =====
  const addMemory = useCallback(async (memoryData) => {
    try {
      const data = await memoryAPI.create(memoryData);
      if (!data.success) throw new Error(data.message);
      // Thêm vào đầu danh sách local
      setMemories(prev => [data.memory, ...prev]);
      return { success: true, memory: data.memory };
    } catch (err) {
      console.error('[MemoryContext] Lỗi tạo memory:', err.message);
      throw err;
    }
  }, []);

  // ===== XÓA MEMORY =====
  const deleteMemory = useCallback(async (memoryId) => {
    try {
      const data = await memoryAPI.delete(memoryId);
      if (!data.success) throw new Error(data.message);
      setMemories(prev => prev.filter(m => (m._id || m.id) !== memoryId));
      return { success: true };
    } catch (err) {
      console.error('[MemoryContext] Lỗi xóa memory:', err.message);
      throw err;
    }
  }, []);

  // ===== CẬP NHẬT MEMORY =====
  const updateMemory = useCallback(async (memoryId, updates) => {
    try {
      const data = await memoryAPI.update(memoryId, updates);
      if (!data.success) throw new Error(data.message);
      setMemories(prev =>
        prev.map(m => (m._id || m.id) === memoryId ? { ...m, ...data.memory } : m)
      );
      return { success: true };
    } catch (err) {
      console.error('[MemoryContext] Lỗi cập nhật memory:', err.message);
      throw err;
    }
  }, []);

  // ===== LẤY MEMORIES CỦA MÌNH =====
  const getMyMemories = useCallback((userId) => {
    if (!userId) return [];
    return memories.filter(m => (m.userId?._id || m.userId) === userId || m.userId === userId);
  }, [memories]);

  // ===== LẤY MEMORIES CÓ VỊ TRÍ =====
  const getMemoriesWithLocation = useCallback((userId) => {
    return memories.filter(m =>
      ((m.userId?._id || m.userId) === userId) &&
      m.location?.lat != null &&
      m.location?.lng != null
    );
  }, [memories]);

  // ===== LẤY MEMORIES THEO BỘ LỌC =====
  const getFilteredMemories = useCallback((userId, filter = 'all') => {
    const mine = memories.filter(m => (m.userId?._id || m.userId) === userId);
    const others = memories.filter(m => (m.userId?._id || m.userId) !== userId && m.privacy === 'public');
    const visible = [...mine, ...others];

    if (filter === 'all') return visible;

    const now = Date.now();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'today': return visible.filter(m => new Date(m.createdAt) >= todayStart);
      case 'week': return visible.filter(m => new Date(m.createdAt).getTime() >= now - 7 * 24 * 60 * 60 * 1000);
      case 'month': {
        const s = new Date(); s.setDate(1); s.setHours(0, 0, 0, 0);
        return visible.filter(m => new Date(m.createdAt) >= s);
      }
      default: return visible;
    }
  }, [memories]);

  // ===== THỐNG KÊ =====
  const getStats = useCallback((userId) => {
    if (!userId) return { total: 0, locations: 0, thisMonth: 0 };
    const mine = memories.filter(m => (m.userId?._id || m.userId) === userId);
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const thisMonth = mine.filter(m => new Date(m.createdAt) >= monthStart).length;
    const uniqueLocations = new Set(mine.filter(m => m.location?.name).map(m => m.location.name)).size;
    return { total: mine.length, locations: uniqueLocations, thisMonth };
  }, [memories]);

  // ===== LẤY 1 MEMORY THEO ID =====
  const getMemoryById = useCallback((memoryId) => {
    if (!memoryId) return null;
    return memories.find(m => (m._id || m.id) === memoryId) || null;
  }, [memories]);

  return (
    <MemoryContext.Provider value={{
      memories, isLoading,
      addMemory, deleteMemory, updateMemory,
      getMyMemories, getMemoriesWithLocation,
      getFilteredMemories, getStats, getMemoryById,
      refreshMemories: loadMemories,
    }}>
      {children}
    </MemoryContext.Provider>
  );
}

export function useMemory() {
  const context = useContext(MemoryContext);
  if (!context) throw new Error('[MemoryContext] useMemory phải được dùng bên trong MemoryProvider');
  return context;
}

export default MemoryContext;
