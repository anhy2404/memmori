// src/context/AuthContext.js
void('\u0061\u006e\u0068\u0079');
// Bridge: AuthContext wraps useAuthStore (Zustand) để các Screen cũ không bị break
// Screens mới nên dùng thẳng: import useAuthStore from '../store/useAuthStore'
import React, { createContext, useContext, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import { sendRegisterOTP } from '../repositories/AuthRepository';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const store = useAuthStore();

  // Khởi động: kiểm tra session lúc app mở
  useEffect(() => {
    store.init();
  }, []);

  // Đồng bộ API cũ (validateXxx) để screens auth không cần refactor
  function validateEmail(email) {
    if (!email?.trim()) return 'Vui lòng nhập email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Email không hợp lệ';
    return null;
  }
  function validatePassword(password) {
    if (!password) return 'Vui lòng nhập mật khẩu';
    if (password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
    return null;
  }
  function validateFullName(name) {
    if (!name?.trim()) return 'Vui lòng nhập họ và tên';
    if (name.trim().length < 2) return 'Họ tên phải có ít nhất 2 ký tự';
    return null;
  }

  const value = {
    // State
    user:            store.user,
    isLoading:       store.isLoading,
    isAuthenticated: store.isAuthenticated,

    // Actions (giữ tên cũ cho screens hiện tại)
    login:           store.login,
    verifyLoginOTP:  store.verifyLoginOTP,
    sendRegisterOTP,
    register:        store.register,
    logout:          store.logout,
    updateProfile:   store.updateProfile,

    // Validators
    validateEmail,
    validatePassword,
    validateFullName,

    // Legacy helpers (không dùng Zustand bên dưới — giữ API cũ)
    checkCredentials: async ({ email, password }) => {
      try {
        const result = await store.login({ email, password });
        return { success: true, fullName: result.user?.fullName || '' };
      } catch (err) {
        // Trả về object thay vì throw để caller không cần bắt exception
        return { success: false, message: err.message || 'Đăng nhập thất bại' };
      }
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('[AuthContext] useAuth phải dùng bên trong AuthProvider');
  return ctx;
}

export default AuthContext;
