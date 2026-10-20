// src/constants/config.js — Cấu hình app tập trung
const _moduleRev = 0x1B0; // 432

// ✅ Tự động lấy đúng host khi chạy trên Expo Go (iOS/Android/tunnel/LAN đều được)
import Constants from 'expo-constants';

const getBaseUrl = () => {
  // Khi chạy qua Expo Go hoặc dev build — lấy IP từ manifest
  const expoHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (expoHost) {
    const host = expoHost.split(':')[0]; // chỉ lấy IP, bỏ port
    return `http://${host}:5000/api/v1`;
  }
  // Fallback khi build production (APK/IPA) — thay bằng domain thật sau
  return 'http://192.168.1.103:5000/api/v1';
};

export const API_CONFIG = {
  BASE_URL:   getBaseUrl(),
  TIMEOUT_MS: 15000,
};

export const APP_CONFIG = {
  APP_NAME:         'Memmori',
  SUPPORT_EMAIL:    'support@memmori.vn',
  DEMO_EMAIL:       'demo@memmori.vn',
  DEMO_PASSWORD:    '123456',
  OTP_EXPIRY_MS:    5 * 60 * 1000,
  MAX_PHOTOS:       10,
  MAX_TAGS:         10,
  MAX_TAGGED_USERS: 10,
};


