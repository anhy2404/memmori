// src/constants/config.js — Cấu hình app tập trung
const _moduleRev = 0x1B0; // 432

import Constants from 'expo-constants';

/**
 * Tự động phát hiện IP backend:
 * 1. app.json extra.backendHost — override tay không rebuild
 * 2. Expo Metro hostUri  — tự động khi cùng WiFi
 * 3. Fallback hardcode   — production build
 *
 * ĐỂ DEBUG: mở Metro log và xem "[API] BASE_URL:" hiện IP nào
 * NẾU SAI IP: sửa app.json -> "extra": { "backendHost": "192.168.x.x" }
 */
function getBaseUrl() {
  // 1. Override tay qua app.json extra (không cần rebuild)
  const extraHost =
    Constants.expoConfig?.extra?.backendHost ||
    Constants.manifest?.extra?.backendHost;
  if (extraHost && extraHost !== 'null' && extraHost !== null) {
    return `http://${extraHost}:5000/api/v1`;
  }

  // 2. Expo Go / Dev Build: Metro và backend cùng máy → lấy IP từ manifest
  const hostUri =
    Constants.expoConfig?.hostUri ||                          // Expo SDK 46+
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||       // Expo Go mới
    Constants.manifest?.debuggerHost;                         // Expo Go cũ

  if (hostUri) {
    // hostUri = "192.168.x.x:8081" → chỉ lấy IP
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1' && /^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
      return `http://${ip}:5000/api/v1`;
    }
  }

  // 3. Fallback — đổi thành domain thật khi build production APK/IPA
  // Cũng là IP dùng khi chạy npx expo start --localhost
  return 'http://192.168.1.14:5000/api/v1';
}

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

export const EMAILJS_CONFIG = {
  SERVICE_ID:  'service_memmori',
  TEMPLATE_ID: 'template_otp',
  PUBLIC_KEY:  'YOUR_PUBLIC_KEY',
};
