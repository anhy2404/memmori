// src/constants/config.js - Cấu hình app tập trung
// Thay IP này bằng IP máy tính của bạn (xem trong terminal khi chạy backend)
export const API_CONFIG = {
  BASE_URL:   'http://192.168.1.103:5000/api',
  TIMEOUT_MS: 15000,
};

export const EMAILJS_CONFIG = {
  SERVICE_ID:  'service_memmori',
  TEMPLATE_ID: 'template_otp',
  PUBLIC_KEY:  'YOUR_PUBLIC_KEY',
};

export const APP_CONFIG = {
  APP_NAME:         'Memmori',
  SUPPORT_EMAIL:    'support@memmori.vn',
  DEMO_EMAIL:       'demo@memmori.vn',
  DEMO_PASSWORD:    '123456',
  OTP_EXPIRY_MS:    5 * 60 * 1000,
  PHOTOS_DIR_NAME:  'memories/',
  MAX_PHOTOS:       10,
  MAX_TAGS:         10,
  MAX_TAGGED_USERS: 10,
};
