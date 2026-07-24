// src/context/AuthContext.js - Quản lý xác thực: đăng nhập, đăng ký, đăng xuất
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Helper: lưu/đọc/xóa session an toàn qua SecureStore (thay AsyncStorage cho credentials)
const SecureSession = {
  async set(key, value) {
    try {
      await SecureStore.setItemAsync(key, JSON.stringify(value));
    } catch {
      // Fallback AsyncStorage nếu SecureStore không khả dụng (emulator/web)
      await AsyncStorage.setItem(key, JSON.stringify(value));
    }
  },
  async get(key) {
    try {
      const val = await SecureStore.getItemAsync(key);
      return val ? JSON.parse(val) : null;
    } catch {
      const val = await AsyncStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    }
  },
  async remove(key) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};

// Hash đơn giản để không lưu plain text (không thay thế bcrypt nhưng tốt hơn nhiều)
function simpleHash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + str.length;
}

// Khóa AsyncStorage
const STORAGE_KEYS = {
  USER: '@memorymap_user',
  USERS_DB: '@memorymap_users_db',
  SESSION: '@memorymap_session',
};

// Tạo Context
const AuthContext = createContext(null);

// Provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Kiểm tra session đã lưu khi khởi động
  useEffect(() => {
    checkSession();
  }, []);

  // Kiểm tra phiên đăng nhập
  async function checkSession() {
    try {
      const savedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      }
      // Tạo tài khoản demo nếu chưa có user nào
      await createDemoAccount();
    } catch (error) {
      console.error('[AuthContext] Lỗi kiểm tra phiên:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Tạo tài khoản demo để test
  async function createDemoAccount() {
    try {
      const users = await getUsersDB();
      const demoExists = users.find(u => u.email === 'demo@memorymap.vn');
      if (!demoExists) {
        const demoUser = {
          id: 'demo_user_001',
          email: 'demo@memorymap.vn',
          password: '123456',
          fullName: 'Người Dùng Demo',
          phonenumber: '0901234567',
          bio: 'Tài khoản demo MemoryMap',
          avatar: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveUsersDB([...users, demoUser]);
        console.log('[AuthContext] Đã tạo tài khoản demo: demo@memorymap.vn / 123456');
      }
    } catch (e) {}
  }

  // ===== VALIDATE =====
  
  // Kiểm tra email hợp lệ
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || email.trim() === '') {
      return 'Vui lòng nhập email';
    }
    if (!emailRegex.test(email.trim())) {
      return 'Email không hợp lệ';
    }
    return null; // null = không có lỗi
  }

  // Kiểm tra mật khẩu hợp lệ
  function validatePassword(password) {
    if (!password || password === '') {
      return 'Vui lòng nhập mật khẩu';
    }
    if (password.length < 6) {
      return 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    if (password.length > 50) {
      return 'Mật khẩu không được quá 50 ký tự';
    }
    return null;
  }

  // Kiểm tra họ tên hợp lệ
  function validateFullName(name) {
    if (!name || name.trim() === '') {
      return 'Vui lòng nhập họ và tên';
    }
    if (name.trim().length < 2) {
      return 'Họ tên phải có ít nhất 2 ký tự';
    }
    return null;
  }

  // ===== LẤY DANH SÁCH USERS =====
  async function getUsersDB() {
    try {
      const db = await AsyncStorage.getItem(STORAGE_KEYS.USERS_DB);
      return db ? JSON.parse(db) : [];
    } catch {
      return [];
    }
  }

  // Lưu danh sách users
  async function saveUsersDB(users) {
    await AsyncStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(users));
  }

  // ===== ĐĂNG KÝ =====
  async function register({ email, password, confirmPassword, fullName, phonenumber = '', bio = '' }) {
    try {
      // Validate đầu vào
      const emailError = validateEmail(email);
      if (emailError) throw new Error(emailError);

      const passwordError = validatePassword(password);
      if (passwordError) throw new Error(passwordError);

      if (password !== confirmPassword) {
        throw new Error('Mật khẩu xác nhận không khớp');
      }

      const nameError = validateFullName(fullName);
      if (nameError) throw new Error(nameError);

      // Kiểm tra email đã tồn tại chưa
      const users = await getUsersDB();
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (existingUser) {
        throw new Error('Email này đã được đăng ký');
      }

      // Tạo user mới
      const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: email.toLowerCase().trim(),
        password: password, // Trong thực tế nên hash password
        fullName: fullName.trim(),
        phonenumber: phonenumber.trim(),
        bio: bio.trim(),
        avatar: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Lưu vào "database" local
      const updatedUsers = [...users, newUser];
      await saveUsersDB(updatedUsers);

      // Tạo session user (không lưu password)
      const sessionUser = {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        phonenumber: newUser.phonenumber,
        bio: newUser.bio,
        avatar: newUser.avatar,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      };

      // Lưu session
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(sessionUser));
      
      setUser(sessionUser);
      setIsAuthenticated(true);
      
      return { success: true, user: sessionUser };
    } catch (error) {
      console.error('[AuthContext] Lỗi đăng ký:', error.message);
      throw error;
    }
  }

  // ===== ĐĂNG NHẬP =====
  async function login({ email, password }) {
    try {
      // Validate đầu vào
      const emailError = validateEmail(email);
      if (emailError) throw new Error(emailError);

      const passwordError = validatePassword(password);
      if (passwordError) throw new Error(passwordError);

      // Tìm user trong database
      const users = await getUsersDB();
      const foundUser = users.find(
        u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
      );

      if (!foundUser) {
        throw new Error('Email hoặc mật khẩu không đúng');
      }

      // Tạo session user (không lưu password)
      const sessionUser = {
        id: foundUser.id,
        email: foundUser.email,
        fullName: foundUser.fullName,
        phonenumber: foundUser.phonenumber || '',
        bio: foundUser.bio || '',
        avatar: foundUser.avatar || null,
        createdAt: foundUser.createdAt,
        updatedAt: foundUser.updatedAt,
      };

      // Lưu session
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(sessionUser));
      
      setUser(sessionUser);
      setIsAuthenticated(true);

      return { success: true, user: sessionUser };
    } catch (error) {
      console.error('[AuthContext] Lỗi đăng nhập:', error.message);
      throw error;
    }
  }

  // ===== ĐĂNG XUẤT =====
  async function logout() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      setUser(null);
      setIsAuthenticated(false);
      return { success: true };
    } catch (error) {
      console.error('[AuthContext] Lỗi đăng xuất:', error.message);
      throw new Error('Đăng xuất thất bại');
    }
  }

  // ===== CẬP NHẬT HỒ SƠ =====
  async function updateProfile(updates) {
    try {
      if (!user) throw new Error('Chưa đăng nhập');

      const updatedUser = {
        ...user,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Cập nhật session
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

      // Cập nhật trong users DB
      const users = await getUsersDB();
      const userIndex = users.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updates, updatedAt: updatedUser.updatedAt };
        await saveUsersDB(users);
      }

      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('[AuthContext] Lỗi cập nhật hồ sơ:', error.message);
      throw error;
    }
  }

  const contextValue = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    validateEmail,
    validatePassword,
    validateFullName,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('[AuthContext] useAuth phải được dùng bên trong AuthProvider');
  }
  return context;
}

export default AuthContext;
