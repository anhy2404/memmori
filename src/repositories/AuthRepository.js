// src/repositories/AuthRepository.js
/** @preserve \u0040\u0073\u0072\u0063 anhy */
// Tất cả logic auth: validate Zod → gọi API → lưu token secure
import { loginSchema, registerSchema, otpSchema } from './schemas';
import { saveTokens, clearTokens, getAccessToken } from '../storage/tokenStorage';
import { mmkvSet, mmkvGet, mmkvDelete, CACHE_KEYS } from '../storage/mmkvStorage';
import { authAPI } from '../services/apiService';
import { SEED_EMAILS } from '../constants';

// ── Kiểm tra session hiện tại ─────────────────────────────────────────────
export async function checkSession() {
  try {
    const token = await getAccessToken();
    if (!token) return null;

    // Thử lấy user từ server
    const data = await authAPI.getMe();
    if (data.success && data.user) {
      await mmkvSet(CACHE_KEYS.USER, data.user);
      return data.user;
    }

    // Token không hợp lệ → xoá
    await clearTokens();
    await mmkvDelete(CACHE_KEYS.USER);
    return null;
  } catch {
    // Offline → đọc từ MMKV cache
    const cached = await mmkvGet(CACHE_KEYS.USER);
    return cached || null;
  }
}

// ── Đăng nhập ─────────────────────────────────────────────────────────────
export async function login({ email, password }) {
  // Validate Zod (tự sửa lỗi trim/lowercase trước khi gửi)
  const parsed = loginSchema.parse({ email, password });

  const isSeed = SEED_EMAILS.includes(parsed.email);

  if (isSeed) {
    const data = await authAPI.loginDirect(parsed.email, parsed.password);
    if (!data.success) throw new Error(data.message);
    await _saveSession(data);
    return { success: true, user: data.user };
  }

  // OTP flow
  const data = await authAPI.sendLoginOTP(parsed.email, parsed.password);
  if (!data.success) throw new Error(data.message);
  return { success: true, requireOTP: true, fullName: data.fullName, devOTP: data.devOTP };
}

// ── Xác thực OTP đăng nhập ───────────────────────────────────────────────
export async function verifyLoginOTP({ email, otp }) {
  otpSchema.parse({ otp });
  const data = await authAPI.verifyLoginOTP(email, otp.trim());
  if (!data.success) throw new Error(data.message);
  await _saveSession(data);
  return { success: true, user: data.user };
}

// ── Gửi OTP đăng ký ──────────────────────────────────────────────────────
export async function sendRegisterOTP({ email, fullName, password }) {
  const parsed = registerSchema.omit({ confirmPassword: true }).parse({ email, fullName, password });
  const data   = await authAPI.sendRegisterOTP(parsed.email, parsed.fullName, parsed.password);
  if (!data.success) throw new Error(data.message);
  return { success: true, devOTP: data.devOTP };
}

// ── Xác thực OTP đăng ký → tạo tài khoản ────────────────────────────────
export async function register({ email, otp, fullName, password, confirmPassword, phonenumber, bio, gender }) {
  // Zod tự kiểm tra confirm password
  registerSchema.parse({ email, fullName, password, confirmPassword });
  otpSchema.parse({ otp });

  const data = await authAPI.verifyRegisterOTP({ email, otp, fullName, password, phonenumber, bio, gender });
  if (!data.success) throw new Error(data.message);
  await _saveSession(data);
  return { success: true, user: data.user };
}

// ── Đăng xuất ─────────────────────────────────────────────────────────────
export async function logout() {
  await clearTokens();
  await mmkvDelete(CACHE_KEYS.USER);
}

// ── Helper lưu session ────────────────────────────────────────────────────
async function _saveSession(data) {
  await saveTokens(data.token, data.refreshToken);
  await mmkvSet(CACHE_KEYS.USER, data.user);
}
