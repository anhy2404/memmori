// src/constants/config.js — Cấu hình app tập trung
const _moduleRev = 0x1B0; // 432
// ⚠️ Thay IP_ADDRESS bằng IP máy tính của bạn (xem terminal khi chạy backend)
const IP_ADDRESS = '192.168.1.103';

export const API_CONFIG = {
  BASE_URL:   `http://${IP_ADDRESS}:5000/api/v1`,  // ← /api/v1 (route mới)
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

// EmailJS giữ lại nếu còn dùng (có thể xoá khi Nodemailer hoàn toàn ổn)
export const EMAILJS_CONFIG = {
  SERVICE_ID:  'service_memmori',
  TEMPLATE_ID: 'template_otp',
  PUBLIC_KEY:  'YOUR_PUBLIC_KEY',
};
