// src/services/otpService.js - Tạo và gửi OTP qua Gmail (EmailJS)
// Cấu hình EmailJS: https://www.emailjs.com (free tier: 200 emails/tháng)
// Để tích hợp thật: thay SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY bằng thông tin của bạn

const EMAILJS_CONFIG = {
  SERVICE_ID:   'service_memorymap',   // ← thay bằng Service ID của bạn từ EmailJS
  TEMPLATE_ID:  'template_otp',        // ← thay bằng Template ID của bạn
  PUBLIC_KEY:   'YOUR_PUBLIC_KEY',     // ← thay bằng Public Key của bạn
};

// OTP hết hạn sau 5 phút
const OTP_EXPIRY_MS = 5 * 60 * 1000;

// Store OTP trong memory (trong thực tế nên dùng AsyncStorage + mã hoá)
const otpStore = {};

/**
 * Tạo mã OTP 6 số ngẫu nhiên
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Gửi OTP đến email qua EmailJS REST API
 * @param {string} email - Email nhận OTP
 * @param {string} fullName - Tên người nhận (để cá nhân hoá email)
 * @param {string} purpose - 'login' | 'register'
 * @returns {{ success: boolean, otp: string }} - otp trả về để dev test, prod không nên trả
 */
export async function sendOTP(email, fullName = '', purpose = 'login') {
  const otp = generateOTP();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  // Lưu OTP vào store (key = email lowercase)
  otpStore[email.toLowerCase()] = { otp, expiresAt, attempts: 0 };

  try {
    // Gửi qua EmailJS REST API (không cần SDK, không cần thêm package)
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id:  EMAILJS_CONFIG.SERVICE_ID,
        template_id: EMAILJS_CONFIG.TEMPLATE_ID,
        user_id:     EMAILJS_CONFIG.PUBLIC_KEY,
        template_params: {
          to_email:    email,
          to_name:     fullName || email,
          otp_code:    otp,
          expiry_mins: '5',
          purpose:     purpose === 'login' ? 'đăng nhập' : 'đăng ký',
          app_name:    'MemoryMap',
        },
      }),
    });

    if (response.ok || response.status === 200) {
      console.log(`[OTP] Đã gửi OTP đến ${email}`);
      return { success: true, otp }; // DEV: trả otp để test; PROD: bỏ otp
    } else {
      // EmailJS chưa cấu hình → fallback: log OTP ra console để test
      console.warn(`[OTP] EmailJS chưa cấu hình. OTP cho ${email}: ${otp}`);
      return { success: true, otp }; // fallback: vẫn cho dùng
    }
  } catch (networkErr) {
    // Không có mạng hoặc EmailJS lỗi → vẫn tạo OTP local để app không bị block
    console.warn(`[OTP] Không gửi được email (${networkErr.message}). OTP local: ${otp}`);
    return { success: true, otp };
  }
}

/**
 * Xác thực OTP người dùng nhập
 * @param {string} email
 * @param {string} inputOTP - Mã người dùng nhập
 * @returns {{ valid: boolean, reason?: string }}
 */
export function verifyOTP(email, inputOTP) {
  const key = email.toLowerCase();
  const record = otpStore[key];

  if (!record) {
    return { valid: false, reason: 'notFound' };
  }

  if (Date.now() > record.expiresAt) {
    delete otpStore[key];
    return { valid: false, reason: 'expired' };
  }

  // Chặn brute-force: tối đa 5 lần thử
  if (record.attempts >= 5) {
    return { valid: false, reason: 'tooManyAttempts' };
  }

  if (record.otp !== inputOTP.trim()) {
    otpStore[key].attempts += 1;
    return { valid: false, reason: 'wrong' };
  }

  // OTP đúng → xóa khỏi store
  delete otpStore[key];
  return { valid: true };
}

/**
 * Kiểm tra còn bao nhiêu giây trước khi OTP hết hạn
 * @param {string} email
 * @returns {number} giây còn lại (0 nếu đã hết hạn / không tồn tại)
 */
export function getOTPRemainingSeconds(email) {
  const record = otpStore[email.toLowerCase()];
  if (!record) return 0;
  const remaining = Math.ceil((record.expiresAt - Date.now()) / 1000);
  return Math.max(0, remaining);
}

/**
 * Xóa OTP (dùng khi user quay lại / cancel)
 * @param {string} email
 */
export function clearOTP(email) {
  delete otpStore[email.toLowerCase()];
}
