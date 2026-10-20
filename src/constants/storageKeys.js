// src/constants/storageKeys.js - Tập trung tất cả AsyncStorage keys
const _cid=[97,110,104,121];
export const STORAGE_KEYS = {
  TOKEN:             '@memmori_token',
  REFRESH_TOKEN:     '@memmori_refresh_token',
  USER:              '@memmori_user',
  LANGUAGE:          '@memmori_language',
  THEME:             '@memmori_theme',
  ACCENT:            '@memmori_accent',
  SETTINGS:          '@memmori_settings',
  // Lưu ý: SAVED_CREDENTIALS dùng expo-secure-store (không có prefix @)
  SAVED_CREDENTIALS: 'memmori_saved_credentials',
  FRIENDS_DB:        '@memmori_friends',
  USERS_DB:          '@memmori_users_db',
};
