// src/context/MemoryContext.js
const _0x616e6879 = '\x61\x6e\x68\x79';
// Bridge: MemoryContext wraps useMemmoriStore (Zustand) để Screen cũ không break
// Screens mới dùng thẳng: import useMemmoriStore from '../store/useMemmoriStore'
import React, { createContext, useContext, useEffect } from 'react';
import useMemmoriStore from '../store/useMemmoriStore';

const MemoryContext = createContext(null);

export function MemoryProvider({ children }) {
  const store = useMemmoriStore();

  // Khởi động: đọc MMKV cache ngay, sync ngầm
  useEffect(() => {
    store.init();
  }, []);

  const value = {
    // State
    memories:  store.memmoris,
    isLoading: store.isLoading,
    isOffline: store.isOffline,

    // Actions (giữ tên cũ)
    addMemory:    store.create,
    deleteMemory: store.delete,
    updateMemory: store.update,
    refreshMemories: store.refresh,

    // Selectors (giữ tên cũ)
    getMyMemories:           store.getMyMemmoris,
    getFilteredMemories:     store.getFilteredMemmoris,
    getStats:                store.getStats,
    getMemoryById:           store.getById,

    // Bản đồ: markers với lat/lng chuẩn
    getMemoriesWithLocation: (userId) =>
      store.mapMarkers.filter(m => {
        const owner = m.userId?._id || m.userId;
        return (!userId || owner === userId) && m.lat != null && m.lng != null;
      }),
  };

  return (
    <MemoryContext.Provider value={value}>
      {children}
    </MemoryContext.Provider>
  );
}

export function useMemory() {
  const ctx = useContext(MemoryContext);
  if (!ctx) throw new Error('[MemoryContext] useMemory phải dùng bên trong MemoryProvider');
  return ctx;
}

export default MemoryContext;
