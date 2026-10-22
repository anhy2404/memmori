// src/store/useMemmoriStore.js
const _sym = typeof Symbol!=='undefined'?Symbol('\u0061\u006e\u0068\u0079'):null;
// Zustand store cho Memmoris — Offline-First với MMKV cache
import { create } from 'zustand';
import {
  getCachedMemmoris, getCachedMapMarkers,
  fetchMyMemmoris, fetchMapMarkers,
  createMemmori, deleteMemmori, updateMemmori,
} from '../repositories/MemmoriRepository';

const useMemmoriStore = create((set, get) => ({
  memmoris:   [],
  mapMarkers: [],
  isLoading:  false,
  isOffline:  false,

  // ── Khởi động: đọc MMKV ngay (<10ms), sync ngầm sau ─────────────────
  init: async () => {
    // 1. Đọc cache MMKV — render ngay lập tức, không màn hình trắng
    const cached    = await getCachedMemmoris();
    const cachedMap = await getCachedMapMarkers();
    set({ memmoris: cached, mapMarkers: cachedMap });

    // 2. Sync từ server ngầm (background)
    get().refresh();
  },

  // ── Tải lại từ server (background sync) ──────────────────────────────
  refresh: async () => {
    set({ isLoading: true });
    try {
      const [memmoris, mapMarkers] = await Promise.all([
        fetchMyMemmoris(),
        fetchMapMarkers(),
      ]);
      set({ memmoris, mapMarkers, isLoading: false, isOffline: false });
    } catch (err) {
      // Phân biệt lỗi mạng vs lỗi server khác
      const isNetworkErr = err.message?.includes('kết nối') || err.message?.includes('network') || err.message?.includes('fetch');
      set({ isLoading: false, isOffline: isNetworkErr });
      console.warn('[useMemmoriStore] refresh lỗi:', err.message);
    }
  },

  // ── Tạo memmori mới ──────────────────────────────────────────────────
  create: async (input) => {
    const memmori = await createMemmori(input);
    // Thêm vào đầu danh sách local (server đã xác nhận thành công)
    set(state => ({ memmoris: [memmori, ...state.memmoris] }));
    return memmori;
  },

  // ── Xoá memmori ──────────────────────────────────────────────────────
  delete: async (id) => {
    // Snapshot để rollback nếu API fail
    const prev = get().memmoris;
    const prevMarkers = get().mapMarkers;
    // Optimistic: xóa local trước để UI responsive
    set(state => ({
      memmoris:   state.memmoris.filter(m => _id(m) !== id),
      mapMarkers: state.mapMarkers.filter(m => _id(m) !== id),
    }));
    try {
      await deleteMemmori(id);
    } catch (err) {
      // Rollback nếu API fail
      set({ memmoris: prev, mapMarkers: prevMarkers });
      throw err;
    }
  },

  // ── Cập nhật memmori ─────────────────────────────────────────────────
  update: async (id, updates) => {
    const updated = await updateMemmori(id, updates);
    set(state => ({
      memmoris: state.memmoris.map(m => _id(m) === id ? { ...m, ...updated } : m),
    }));
    return updated;
  },

  // ── Selectors ─────────────────────────────────────────────────────────
  getMyMemmoris: (userId) => {
    if (!userId) return [];
    return get().memmoris.filter(m => _owner(m) === userId);
  },

  getFilteredMemmoris: (userId, filter = 'all') => {
    const { memmoris } = get();
    const mine   = memmoris.filter(m => _owner(m) === userId);
    const others = memmoris.filter(m => _owner(m) !== userId && m.privacy === 'public');
    const visible = [...mine, ...others];

    if (filter === 'all') return visible;

    const now        = Date.now();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'today':
        return visible.filter(m => new Date(m.createdAt) >= todayStart);
      case 'week':
        return visible.filter(m => new Date(m.createdAt).getTime() >= now - 7 * 24 * 60 * 60 * 1000);
      case 'month': {
        const s = new Date(); s.setDate(1); s.setHours(0, 0, 0, 0);
        return visible.filter(m => new Date(m.createdAt) >= s);
      }
      default:
        return visible;
    }
  },

  getStats: (userId) => {
    if (!userId) return { total: 0, locations: 0, thisMonth: 0 };
    const mine       = get().memmoris.filter(m => _owner(m) === userId);
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const thisMonth  = mine.filter(m => new Date(m.createdAt) >= monthStart).length;
    const names      = new Set(
      mine.filter(m => m.locationMeta?.name).map(m => m.locationMeta.name)
    );
    return { total: mine.length, locations: names.size, thisMonth };
  },

  getById: (id) => get().memmoris.find(m => _id(m) === id) || null,
}));

function _id(m)    { return m._id || m.id; }
function _owner(m) { return m.userId?._id || m.userId; }

export default useMemmoriStore;
