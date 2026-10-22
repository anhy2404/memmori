// src/store/useAuthStore.js
const _moduleRev = 0x1B0; // 432
// Zustand store quản lý User Session — thay AuthContext
import { create } from 'zustand';
import {
  checkSession, login, verifyLoginOTP,
  sendRegisterOTP, register, logout,
} from '../repositories/AuthRepository';
import { userAPI, authAPI } from '../services/apiService';
import { mmkvSet, CACHE_KEYS } from '../storage/mmkvStorage';

const useAuthStore = create((set, get) => ({
  user:            null,
  isLoading:       true,
  isAuthenticated: false,

  // ── Khởi động: kiểm tra session ──────────────────────────────────────
  init: async () => {
    set({ isLoading: true });
    // Đăng ký callback để apiService có thể trigger logout khi token hết hạn
    globalThis.__memmoriSessionExpired = () => {
      set({ user: null, isAuthenticated: false });
    };
    try {
      const user = await checkSession();
      set({ user, isAuthenticated: !!user, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  // ── Đăng nhập ────────────────────────────────────────────────────────
  login: async (credentials) => {
    const result = await login(credentials);
    if (result.user) {
      set({ user: result.user, isAuthenticated: true });
    }
    return result;
  },

  // ── Xác thực OTP đăng nhập ──────────────────────────────────────────
  verifyLoginOTP: async (params) => {
    const result = await verifyLoginOTP(params);
    if (result.user) {
      set({ user: result.user, isAuthenticated: true });
    }
    return result;
  },

  // ── Đăng ký ─────────────────────────────────────────────────────────
  sendRegisterOTP,

  register: async (params) => {
    const result = await register(params);
    if (result.user) {
      set({ user: result.user, isAuthenticated: true });
    }
    return result;
  },

  // ── Đăng xuất ────────────────────────────────────────────────────────
  logout: async () => {
    await logout();
    set({ user: null, isAuthenticated: false });
  },

  // ── Cập nhật hồ sơ ──────────────────────────────────────────────────
  updateProfile: async (updates) => {
    const data = await userAPI.updateProfile(updates);
    if (!data.success) throw new Error(data.message);
    const updatedUser = { ...get().user, ...data.user };
    await mmkvSet(CACHE_KEYS.USER, updatedUser);
    set({ user: updatedUser });
    return updatedUser;
  },

  // ── Refresh user từ server (dùng sau upload avatar hoặc cần sync mới nhất) ──
  refreshUser: async () => {
    try {
      const data = await authAPI.getMe();
      if (data.success && data.user) {
        await mmkvSet(CACHE_KEYS.USER, data.user);
        set({ user: data.user });
        return data.user;
      }
    } catch (err) {
      console.error('[useAuthStore] refreshUser lỗi:', err.message);
    }
    return get().user;
  },
}));

export default useAuthStore;
