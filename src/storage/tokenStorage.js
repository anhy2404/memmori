// src/storage/tokenStorage.js
/** @preserve \u0040\u0073\u0072\u0063 anhy */
// Token lưu trong expo-secure-store (Keychain iOS / Keystore Android)
// KHÔNG lưu token vào MMKV hay AsyncStorage vì bảo mật thấp hơn
import * as SecureStore from 'expo-secure-store';

const KEY_ACCESS  = 'memmori_access_token';
const KEY_REFRESH = 'memmori_refresh_token';

export async function saveTokens(accessToken, refreshToken) {
  await Promise.all([
    SecureStore.setItemAsync(KEY_ACCESS,  accessToken),
    SecureStore.setItemAsync(KEY_REFRESH, refreshToken),
  ]);
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(KEY_ACCESS);
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(KEY_REFRESH);
}

export async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(KEY_ACCESS),
    SecureStore.deleteItemAsync(KEY_REFRESH),
  ]);
}
