// src/services/apiService.js
const _cid=[97,110,104,121];
// HTTP client kết nối tới backend API v1
// Token lưu trong expo-secure-store (Keychain/Keystore) — không dùng AsyncStorage
import { API_CONFIG } from '../constants';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../storage/tokenStorage';

export const BASE_URL = API_CONFIG.BASE_URL; // http://IP:5000/api/v1
const TIMEOUT_MS = API_CONFIG.TIMEOUT_MS || 15000;

// Log URL đang dùng — giúp debug khi chạy trên nhiều máy/mạng khác nhau
if (__DEV__) {
  console.log('[API] BASE_URL:', BASE_URL);
}

// Helper: fetch với timeout để tránh treo mãi khi server không phản hồi
function fetchWithTimeout(url, config, ms = TIMEOUT_MS) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller
    ? setTimeout(() => controller.abort(), ms)
    : null;
  const fetchConfig = controller
    ? { ...config, signal: controller.signal }
    : config;
  return fetch(url, fetchConfig).finally(() => { if (timer) clearTimeout(timer); });
}

// ── Base request ──────────────────────────────────────────────────────────
async function request(endpoint, options = {}) {
  const token = await getAccessToken();

  const config = {
    method:  options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  };

  try {
    const res  = await fetchWithTimeout(`${BASE_URL}${endpoint}`, config);
    const data = await res.json();

    // Token hết hạn → thử refresh tự động
    if (res.status === 401 && data.code === 'TOKEN_EXPIRED') {
      const refreshed = await _refreshAccessToken();
      if (refreshed) {
        const newToken = await getAccessToken();
        config.headers.Authorization = `Bearer ${newToken}`;
        const retryRes = await fetchWithTimeout(`${BASE_URL}${endpoint}`, config);
        return retryRes.json();
      }
      // Refresh thất bại → xoá token và emit event để store reset isAuthenticated
      await clearTokens();
      // Phát sự kiện để useAuthStore bắt và logout
      if (typeof globalThis !== 'undefined') {
        globalThis.__memmoriSessionExpired?.();
      }
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Yêu cầu hết thời gian. Kiểm tra kết nối mạng.');
    }
    // Log URL để dễ debug khi đổi IP / mạng
    console.warn('[API] Lỗi kết nối:', `${BASE_URL}${endpoint}`, err.message);
    throw new Error('Không kết nối được server. Kiểm tra backend đang chạy và cùng WiFi.');
  }
}

// Multipart upload (ảnh) — không set Content-Type (browser/RN tự thêm boundary)
async function uploadRequest(endpoint, formData) {
  const token = await getAccessToken();
  try {
    const res = await fetchWithTimeout(`${BASE_URL}${endpoint}`, {
      method:  'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body:    formData,
    }, 60000); // upload timeout 60s (ảnh có thể lớn)
    return res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Upload hết thời gian. Kiểm tra kết nối mạng.');
    }
    throw new Error('Upload thất bại. Kiểm tra kết nối mạng.');
  }
}

async function _refreshAccessToken() {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;

    const res  = await fetch(`${BASE_URL}/auth/refresh-token`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refreshToken }),
    });
    const data = await res.json();

    if (data.success && data.token) {
      // Lưu lại vào secure store
      await saveTokens(data.token, refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ── Auth API ──────────────────────────────────────────────────────────────
export const authAPI = {
  sendRegisterOTP: (email, fullName, password) =>
    request('/auth/register/send-otp', { method: 'POST', body: { email, fullName, password } }),

  verifyRegisterOTP: (data) =>
    request('/auth/register/verify-otp', { method: 'POST', body: data }),

  sendLoginOTP: (email, password) =>
    request('/auth/login/send-otp', { method: 'POST', body: { email, password } }),

  verifyLoginOTP: (email, otp) =>
    request('/auth/login/verify-otp', { method: 'POST', body: { email, otp } }),

  loginDirect: (email, password) =>
    request('/auth/login/direct', { method: 'POST', body: { email, password } }),

  getMe: () => request('/auth/me'),
};

// ── User API ──────────────────────────────────────────────────────────────
export const userAPI = {
  updateProfile: (updates) =>
    request('/users/me', { method: 'PATCH', body: updates }),

  changePassword: (currentPassword, newPassword) =>
    request('/users/me/password', { method: 'PATCH', body: { currentPassword, newPassword } }),

  uploadAvatar: async (imageUri) => {
    const formData = new FormData();
    const filename = imageUri.split('/').pop();
    const ext      = filename.split('.').pop() || 'jpg';
    formData.append('avatar', { uri: imageUri, name: filename, type: `image/${ext}` });
    return uploadRequest('/users/me/avatar', formData);
  },

  searchUsers:    (q)      => request(`/users/search?q=${encodeURIComponent(q)}`),
  getUserProfile: (userId) => request(`/users/${userId}`),
  getAllUsers:    (page = 1) => request(`/users/all?page=${page}`),
  deleteUser:     (userId) => request(`/users/${userId}`, { method: 'DELETE' }),
};

// ── Memory API — dùng FormData (images + GeoJSON location) ────────────────
export const memoryAPI = {
  // formData đã được build sẵn bởi MemmoriRepository
  create: (formData) => uploadRequest('/memmoris', formData),

  getMyMemories:         (page = 1, filter = 'all') =>
    request(`/memmoris/my?page=${page}&filter=${filter}`),

  getMemoriesWithLocation: () => request('/memmoris/map'),

  getMapBounds: (swLng, swLat, neLng, neLat) =>
    request(`/memmoris/map-bounds?swLng=${swLng}&swLat=${swLat}&neLng=${neLng}&neLat=${neLat}`),

  getPublicMemories: (page = 1) => request(`/memmoris/feed?page=${page}`),

  getStats: () => request('/memmoris/stats'),

  getById: (id) => request(`/memmoris/${id}`),

  update: (id, updates) =>
    request(`/memmoris/${id}`, { method: 'PATCH', body: updates }),

  delete: (id) =>
    request(`/memmoris/${id}`, { method: 'DELETE' }),
};

// ── Friends API ───────────────────────────────────────────────────────────
export const friendsAPI = {
  getFriends:       () => request('/friends'),
  getPending:       () => request('/friends/requests/pending'),
  getSent:          () => request('/friends/requests/sent'),
  sendRequest:      (recipientId) =>
    request('/friends/request', { method: 'POST', body: { recipientId } }),
  acceptRequest:    (requesterId) =>
    request('/friends/accept', { method: 'POST', body: { requesterId } }),
  declineRequest:   (requesterId) =>
    request('/friends/decline', { method: 'POST', body: { requesterId } }),
  unfriend:         (friendId) =>
    request('/friends/unfriend', { method: 'POST', body: { friendId } }),
};

// ── Notifications API ─────────────────────────────────────────────────────
export const notificationsAPI = {
  getAll:       (page = 1) => request(`/notifications?page=${page}`),
  markAsRead:   (id)       => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead:  ()         => request('/notifications/read-all', { method: 'POST' }),
  delete:       (id)       => request(`/notifications/${id}`, { method: 'DELETE' }),
  clearAll:     ()         => request('/notifications/clear-all', { method: 'POST' }),
};
