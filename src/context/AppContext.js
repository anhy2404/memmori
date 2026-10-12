// src/context/AppContext.js - Quản lý ngôn ngữ, theme, cài đặt toàn app
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, buildThemeWithAccent, ACCENT_PRESETS } from '../theme';
import { LANGUAGES, DEFAULT_LANGUAGE, t as translate } from '../i18n';

// Khóa lưu trữ trong AsyncStorage
const STORAGE_KEYS = {
  LANGUAGE: '@memmori_language',
  THEME: '@memmori_theme',
  ACCENT: '@memmori_accent',
  SETTINGS: '@memmori_settings',
};

// Giá trị mặc định của context
const defaultContextValue = {
  language: DEFAULT_LANGUAGE,
  theme: lightTheme,
  isDark: false,
  themeMode: 'system', // 'light' | 'dark' | 'system'
  accentColor: 'lavender',
  settings: {},
  changeLanguage: () => {},
  toggleTheme: () => {},
  setThemeMode: () => {},
  setAccentColor: () => {},
  t: (key, params) => key,
  isLoading: true,
};

// Tạo Context
const AppContext = createContext(defaultContextValue);

// Provider component
export function AppProvider({ children }) {
  const systemColorScheme = useColorScheme(); // 'light' | 'dark' | null
  
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [themeMode, setThemeModeState] = useState('system'); // 'light' | 'dark' | 'system'
  const [accentColor, setAccentColorState] = useState('lavender');
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Tính toán isDark dựa trên themeMode và systemColorScheme
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  const theme = buildThemeWithAccent(isDark, accentColor);

  // Hàm dịch ngôn ngữ - bind với language hiện tại
  const t = useCallback((key, params = {}) => {
    return translate(key, language, params);
  }, [language]);

  // Tải cài đặt từ AsyncStorage khi khởi động
  useEffect(() => {
    loadSettings();
  }, []);

  // Tải cài đặt đã lưu
  async function loadSettings() {
    try {
      const [savedLang, savedTheme, savedSettings] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE),
        AsyncStorage.getItem(STORAGE_KEYS.THEME),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
      ]);

      // Áp dụng ngôn ngữ đã lưu
      if (savedLang && Object.values(LANGUAGES).includes(savedLang)) {
        setLanguage(savedLang);
      }

      // Áp dụng theme đã lưu
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeModeState(savedTheme);
      }

      // Áp dụng accent color đã lưu
      const savedAccent = await AsyncStorage.getItem(STORAGE_KEYS.ACCENT);
      if (savedAccent && ACCENT_PRESETS.find(p => p.id === savedAccent)) {
        setAccentColorState(savedAccent);
      }

      // Áp dụng settings khác
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      // Lỗi khi tải cài đặt - dùng giá trị mặc định
      console.error('[AppContext] Lỗi tải cài đặt:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Thay đổi ngôn ngữ
  const changeLanguage = useCallback(async (newLang) => {
    try {
      if (!Object.values(LANGUAGES).includes(newLang)) {
        throw new Error(`Ngôn ngữ không hỗ trợ: ${newLang}`);
      }
      setLanguage(newLang);
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, newLang);
    } catch (error) {
      console.error('[AppContext] Lỗi thay đổi ngôn ngữ:', error);
      throw error;
    }
  }, []);

  // Toggle giữa light và dark theme
  const toggleTheme = useCallback(async () => {
    try {
      const newMode = isDark ? 'light' : 'dark';
      setThemeModeState(newMode);
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, newMode);
    } catch (error) {
      console.error('[AppContext] Lỗi toggle theme:', error);
      throw error;
    }
  }, [isDark]);

  // Đặt theme mode cụ thể
  const setThemeMode = useCallback(async (mode) => {
    try {
      if (!['light', 'dark', 'system'].includes(mode)) {
        throw new Error(`Theme mode không hợp lệ: ${mode}`);
      }
      setThemeModeState(mode);
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, mode);
    } catch (error) {
      console.error('[AppContext] Lỗi đặt theme mode:', error);
      throw error;
    }
  }, []);

  // Đặt màu accent
  const setAccentColor = useCallback(async (accentId) => {
    try {
      if (!ACCENT_PRESETS.find(p => p.id === accentId)) {
        throw new Error(`Accent không hợp lệ: ${accentId}`);
      }
      setAccentColorState(accentId);
      await AsyncStorage.setItem(STORAGE_KEYS.ACCENT, accentId);
    } catch (error) {
      console.error('[AppContext] Lỗi đặt accent color:', error);
      throw error;
    }
  }, []);

  // Cập nhật setting tùy chỉnh
  const updateSetting = useCallback(async (key, value) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    } catch (error) {
      console.error('[AppContext] Lỗi cập nhật setting:', error);
      throw error;
    }
  }, [settings]);

  const contextValue = {
    language,
    theme,
    isDark,
    themeMode,
    accentColor,
    settings,
    isLoading,
    changeLanguage,
    toggleTheme,
    setThemeMode,
    setAccentColor,
    updateSetting,
    t,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook để sử dụng AppContext
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('[AppContext] useApp phải được dùng bên trong AppProvider');
  }
  return context;
}

export default AppContext;
