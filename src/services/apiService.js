// src/services/apiService.js - Kết nối frontend với backend API
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS } from '../constants';

// ===== CẤU HÌNH =====
// Thay IP trong src/constants/config.js → API_CONFIG.BASE_URL
export const BASE_URL = API_CONFIG.BASE_URL;

const TOKEN_KEY = STORAGE_KEYS.TOKEN;
const REFRESH_TOKEN_KEY = STORAGE_KEYS.REFRESH_TOKEN;

// ===== LƯU / ĐỌC TOKEN =====
export async function saveTokens(token, refreshToken) {
  await Promise.all([
    AsyncStorage.setItem(TOKEN_KEY, token),
    AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearTokens() {
  await Promise.all([
    AsyncStorage.removeItem(TOKEN_KEY),
    AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
  ]);
}

// ===== BASE FETCH =====
async function request(endpoint, options = {}) {
  const token = await getToken();

  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await res.json();

    // Token hết hạn → thử refresh
    if (res.status === 401 && data.code === 'TOKEN_EXPIRED') {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry với token mới
        const newToken = await getToken();
        config.headers.Authorization = `Bearer ${newToken}`;
        const retryRes = await fetch(`${BASE_URL}${endpoint}`, config);
        return retryRes.json();
      }
    }

    return data;
  } catch (err) {
    throw new Error('Không kết nối được server. Kiểm tra kết nối mạng.');
  }
}

// Refresh access token
async function refreshAccessToken() {
  try {
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return false;

    const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await res.json();

    if (data.success && data.token) {
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Multipart upload (ảnh)
async function uploadRequest(endpoint, formData) {
  const token = await getToken();
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });
    return res.json();
  } catch (err) {
    throw new Error('Upload thất bại. Kiểm tra kết nối mạng.');
  }
}

// ===== AUTH API =====
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

// ===== USER API =====
export const userAPI = {
  updateProfile: (updates) =>
    request('/users/me', { method: 'PATCH', body: updates }),

  changePassword: (currentPassword, newPassword) =>
    request('/users/me/password', { method: 'PATCH', body: { currentPassword, newPassword } }),

  uploadAvatar: async (imageUri) => {
    const formData = new FormData();
    const filename = imageUri.split('/').pop();
    const ext = filename.split('.').pop() || 'jpg';
    formData.append('avatar', { uri: imageUri, name: filename, type: `image/${ext}` });
    return uploadRequest('/users/me/avatar', formData);
  },

  searchUsers: (q) => request(`/users/search?q=${encodeURIComponent(q)}`),

  getUserProfile: (userId) => request(`/users/${userId}`),

  getAllUsers: (page = 1) => request(`/users/all?page=${page}`),
};

// ===== MEMORY API =====
export const memoryAPI = {
  create: async (memoryData) => {
    const formData = new FormData();
    formData.append('title', memoryData.title);
    formData.append('description', memoryData.description || '');
    formData.append('aiCaption', memoryData.aiCaption || '');
    formData.append('privacy', memoryData.privacy || 'private');

    if (memoryData.location) {
      formData.append('location', JSON.stringify(memoryData.location));
    }
    if (memoryData.tags?.length) {
      formData.append('tags', JSON.stringify(memoryData.tags));
    }
    if (memoryData.taggedUsers?.length) {
      formData.append('taggedUsers', JSON.stringify(memoryData.taggedUsers.map(u => u.id || u._id)));
    }

    // Attach ảnh
    if (memoryData.photos?.length) {
      for (const photoUri of memoryData.photos) {
        const filename = photoUri.split('/').pop();
        const ext = filename.split('.').pop() || 'jpg';
        formData.append('photos', { uri: photoUri, name: filename, type: `image/${ext}` });
      }
    }

    return uploadRequest('/memories', formData);
  },

  getMyMemories: (page = 1, filter = 'all') =>
    request(`/memories/my?page=${page}&filter=${filter}`),

  getMemoriesWithLocation: () => request('/memories/map'),

  getPublicMemories: (page = 1) => request(`/memories/feed?page=${page}`),

  getStats: () => request('/memories/stats'),

  getById: (id) => request(`/memories/${id}`),

  update: (id, updates) =>
    request(`/memories/${id}`, { method: 'PATCH', body: updates }),

  delete: (id) =>
    request(`/memories/${id}`, { method: 'DELETE' }),
};

// ===== FRIENDS API =====
export const friendsAPI = {
  getFriends: () => request('/friends'),
  getPendingRequests: () => request('/friends/requests/pending'),
  getSentRequests: () => request('/friends/requests/sent'),
  sendRequest: (recipientId) =>
    request('/friends/request', { method: 'POST', body: { recipientId } }),
  acceptRequest: (requesterId) =>
    request('/friends/accept', { method: 'POST', body: { requesterId } }),
  declineRequest: (requesterId) =>
    request('/friends/decline', { method: 'POST', body: { requesterId } }),
  unfriend: (friendId) =>
    request('/friends/unfriend', { method: 'POST', body: { friendId } }),
};

// ===== NOTIFICATIONS API =====
export const notificationsAPI = {
  getAll: (page = 1) => request(`/notifications?page=${page}`),
  markAsRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () => request('/notifications/read-all', { method: 'POST' }),
  delete: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
  clearAll: () => request('/notifications/clear-all', { method: 'POST' }),
};
