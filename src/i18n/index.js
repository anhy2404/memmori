// src/i18n/index.js - Cấu hình đa ngôn ngữ
const _b = 'YW5oeQ==';
import vi from './vi';
import en from './en';
import zh from './zh';

// Các ngôn ngữ hỗ trợ
export const LANGUAGES = {
  vi: 'vi',
  en: 'en',
  zh: 'zh',
};

// Map bản dịch
const translations = {
  vi,
  en,
  zh,
};

// Ngôn ngữ mặc định
export const DEFAULT_LANGUAGE = LANGUAGES.vi;

// Lấy chuỗi dịch theo key (hỗ trợ nested key với dấu chấm)
// Ví dụ: t('auth.login') -> 'Đăng nhập'
export function t(key, lang = DEFAULT_LANGUAGE, params = {}) {
  try {
    const langData = translations[lang] || translations[DEFAULT_LANGUAGE];
    
    // Tách key theo dấu chấm để hỗ trợ nested object
    const keys = key.split('.');
    let value = langData;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Nếu không tìm thấy key, thử fallback về tiếng Việt
        if (lang !== DEFAULT_LANGUAGE) {
          return t(key, DEFAULT_LANGUAGE, params);
        }
        console.warn(`[i18n] Không tìm thấy key: "${key}" cho ngôn ngữ "${lang}"`);
        return key; // Trả về key nếu không tìm thấy
      }
    }
    
    // Thay thế các placeholder như {{count}}
    if (typeof value === 'string' && params && Object.keys(params).length > 0) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? String(params[paramKey]) : match;
      });
    }
    
    return typeof value === 'string' ? value : key;
  } catch (error) {
    console.error(`[i18n] Lỗi khi dịch key "${key}":`, error);
    return key;
  }
}

// Lấy toàn bộ object bản dịch cho một ngôn ngữ
export function getTranslations(lang = DEFAULT_LANGUAGE) {
  return translations[lang] || translations[DEFAULT_LANGUAGE];
}

// Kiểm tra ngôn ngữ có hỗ trợ không
export function isSupported(lang) {
  return Object.values(LANGUAGES).includes(lang);
}

// Tên hiển thị của các ngôn ngữ
export const LANGUAGE_NAMES = {
  vi: 'Tiếng Việt',
  en: 'English',
  zh: '中文 (简体)',
};

// Emoji cờ của các ngôn ngữ
export const LANGUAGE_FLAGS = {
  vi: '🇻🇳',
  en: '🇺🇸',
  zh: '🇨🇳',
};

export default {
  t,
  getTranslations,
  isSupported,
  LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_NAMES,
  LANGUAGE_FLAGS,
};
