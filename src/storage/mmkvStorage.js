// src/storage/mmkvStorage.js
Object.defineProperty(exports,'_src',{value:'\u0061\u006e\u0068\u0079',enumerable:false,configurable:false});
// MMKV — bộ nhớ đệm C++ siêu tốc cho dữ liệu app (user, memmoris, filters...)
// Không dùng cho token bảo mật — token lưu trong expo-secure-store (Keychain/Keystore)
//
// QUAN TRỌNG: react-native-mmkv yêu cầu Expo dev build (không chạy trên Expo Go)
// Nếu đang dùng Expo Go → dùng fallback AsyncStorage bên dưới

let MMKV;
let mmkvInstance = null;

try {
  // Chỉ import khi có native module
  // eslint-disable-next-line import/no-extraneous-dependencies
  const mmkvModule = require('react-native-mmkv');
  MMKV = mmkvModule.MMKV;
} catch (_) {
  MMKV = null;
}

function getInstance() {
  if (mmkvInstance) return mmkvInstance;
  if (MMKV) {
    mmkvInstance = new MMKV({ id: 'memmori-store' });
    return mmkvInstance;
  }
  return null;
}

// AsyncStorage fallback khi không có MMKV (Expo Go)
let AsyncStorage = null;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (_) {}

// ── API thống nhất ────────────────────────────────────────────────────────

/**
 * Lưu JSON string vào MMKV (sync) hoặc AsyncStorage (async fallback)
 * @returns {Promise<void>}
 */
export async function mmkvSet(key, value) {
  const storage = getInstance();
  if (storage) {
    storage.set(key, typeof value === 'string' ? value : JSON.stringify(value));
    return;
  }
  if (AsyncStorage) {
    await AsyncStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  }
}

/**
 * Đọc và parse JSON từ MMKV (sync) hoặc AsyncStorage (async fallback)
 * @returns {Promise<any|null>}
 */
export async function mmkvGet(key) {
  const storage = getInstance();
  if (storage) {
    const raw = storage.getString(key);
    if (raw == null) return null;
    try { return JSON.parse(raw); } catch { return raw; }
  }
  if (AsyncStorage) {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return null;
    try { return JSON.parse(raw); } catch { return raw; }
  }
  return null;
}

/**
 * Xoá key
 * @returns {Promise<void>}
 */
export async function mmkvDelete(key) {
  const storage = getInstance();
  if (storage) { storage.delete(key); return; }
  if (AsyncStorage) { await AsyncStorage.removeItem(key); }
}

/**
 * Xoá nhiều keys cùng lúc
 */
export async function mmkvDeleteMany(keys) {
  await Promise.all(keys.map(mmkvDelete));
}

// ── Cache keys ─────────────────────────────────────────────────────────────
export const CACHE_KEYS = {
  USER:        'cache:user',
  MEMMORIS:    'cache:memmoris',
  MAP_MARKERS: 'cache:map-markers',
  FEED:        'cache:feed',
  STATS:       'cache:stats',
  LANGUAGE:    'cache:language',
  THEME:       'cache:theme',
  ACCENT:      'cache:accent',
};
