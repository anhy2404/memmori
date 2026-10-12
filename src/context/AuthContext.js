// src/context/AuthContext.js - Quản lý xác thực qua Backend API
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, userAPI, saveTokens, clearTokens, getToken } from '../services/apiService';
import { SEED_EMAILS } from '../constants';

const USER_KEY = '@memmori_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  // ===== KIỂM TRA SESSION =====
  async function checkSession() {
    try {
      const token = await getToken();
      if (!token) return;

      const data = await authAPI.getMe();
      if (data.success && data.user) {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        // Token không hợp lệ → xóa
        await clearTokens();
        await AsyncStorage.removeItem(USER_KEY);
      }
    } catch (err) {
      // Offline → dùng user cached
      const cached = await AsyncStorage.getItem(USER_KEY);
      if (cached) {
        setUser(JSON.parse(cached));
        setIsAuthenticated(true);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // ===== VALIDATE =====
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || email.trim() === '') return 'Vui lòng nhập email';
    if (!emailRegex.test(email.trim())) return 'Email không hợp lệ';
    return null;
  }

  function validatePassword(password) {
    if (!password || password === '') return 'Vui lòng nhập mật khẩu';
    if (password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
    if (password.length > 50) return 'Mật khẩu không được quá 50 ký tự';
    return null;
  }

  function validateFullName(name) {
    if (!name || name.trim() === '') return 'Vui lòng nhập họ và tên';
    if (name.trim().length < 2) return 'Họ tên phải có ít nhất 2 ký tự';
    return null;
  }

  // ===== ĐĂNG NHẬP =====
  async function login({ email, password }) {
    const emailError = validateEmail(email);
    if (emailError) throw new Error(emailError);
    const passwordError = validatePassword(password);
    if (passwordError) throw new Error(passwordError);

    const isSeed = SEED_EMAILS.includes(email.toLowerCase().trim());

    if (isSeed) {
      // Seed accounts đăng nhập thẳng
      const data = await authAPI.loginDirect(email, password);
      if (!data.success) throw new Error(data.message);
      await _saveSession(data);
      return { success: true, user: data.user };
    } else {
      // Gửi OTP trước
      const data = await authAPI.sendLoginOTP(email, password);
      if (!data.success) throw new Error(data.message);
      return { success: true, requireOTP: true, fullName: data.fullName, devOTP: data.devOTP };
    }
  }

  // ===== XÁC THỰC OTP ĐĂNG NHẬP =====
  async function verifyLoginOTP({ email, otp }) {
    const data = await authAPI.verifyLoginOTP(email, otp);
    if (!data.success) throw new Error(data.message);
    await _saveSession(data);
    return { success: true, user: data.user };
  }

  // ===== ĐĂNG KÝ BƯỚC 1: gửi OTP =====
  async function sendRegisterOTP({ email, fullName, password }) {
    const emailError = validateEmail(email);
    if (emailError) throw new Error(emailError);
    const passwordError = validatePassword(password);
    if (passwordError) throw new Error(passwordError);
    const nameError = validateFullName(fullName);
    if (nameError) throw new Error(nameError);

    const data = await authAPI.sendRegisterOTP(email, fullName, password);
    if (!data.success) throw new Error(data.message);
    return { success: true, devOTP: data.devOTP };
  }

  // ===== ĐĂNG KÝ BƯỚC 2: xác thực OTP =====
  async function register({ email, otp, fullName, password, confirmPassword, phonenumber = '', bio = '' }) {
    if (password !== confirmPassword) throw new Error('Mật khẩu xác nhận không khớp');

    const data = await authAPI.verifyRegisterOTP({ email, otp, fullName, password, phonenumber, bio });
    if (!data.success) throw new Error(data.message);
    await _saveSession(data);
    return { success: true, user: data.user };
  }

  // ===== KIỂM TRA CREDENTIALS (không tạo session) =====
  async function checkCredentials({ email, password }) {
    const emailError = validateEmail(email);
    if (emailError) throw new Error(emailError);

    const data = await authAPI.sendLoginOTP(email, password);
    if (!data.success) throw new Error(data.message);
    return { success: true, fullName: data.fullName };
  }

  // ===== KIỂM TRA EMAIL =====
  async function checkEmailAvailable(email) {
    const emailError = validateEmail(email);
    if (emailError) throw new Error(emailError);
    // API sẽ báo lỗi nếu email đã tồn tại khi gọi sendRegisterOTP
    return { available: true };
  }

  // ===== ĐĂNG XUẤT =====
  async function logout() {
    await clearTokens();
    await AsyncStorage.removeItem(USER_KEY);
    setUser(null);
    setIsAuthenticated(false);
    return { success: true };
  }

  // ===== CẬP NHẬT HỒ SƠ =====
  async function updateProfile(updates) {
    if (!user) throw new Error('Chưa đăng nhập');

    const data = await userAPI.updateProfile(updates);
    if (!data.success) throw new Error(data.message);

    const updatedUser = { ...user, ...data.user };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
    return { success: true, user: updatedUser };
  }

  // ===== LẤY TẤT CẢ USERS =====
  async function getAllUsers() {
    const data = await userAPI.getAllUsers();
    return data.users || [];
  }

  function getSeedInfo() {
    return SEED_EMAILS.map(email => ({ email }));
  }

  // Helper lưu session
  async function _saveSession(data) {
    await saveTokens(data.token, data.refreshToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    setIsAuthenticated(true);
  }

  return (
    <AuthContext.Provider value={{
      user, isLoading, isAuthenticated,
      login, verifyLoginOTP, sendRegisterOTP, register,
      logout, updateProfile,
      validateEmail, validatePassword, validateFullName,
      checkCredentials, checkEmailAvailable,
      getAllUsers, getSeedInfo,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('[AuthContext] useAuth phải được dùng bên trong AuthProvider');
  return context;
}

export default AuthContext;
