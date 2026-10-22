// src/context/AppContext.js — Quản lý ngôn ngữ, theme, cài đặt toàn app
const _b = 'YW5oeQ==';
// Dùng MMKV thay AsyncStorage để đọc/ghi nhanh hơn (<1ms vs ~5ms)
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, buildThemeWithAccent, ACCENT_PRESETS } from '../theme';
import { LANGUAGES, DEFAULT_LANGUAGE, t as translate } from '../i18n';
import { mmkvSet, mmkvGet, CACHE_KEYS } from '../storage/mmkvStorage';

const defaultContextValue = {
  language: DEFAULT_LANGUAGE,
  theme:    lightTheme,
  isDark:   false,
  themeMode:'system',
  accentColor: 'lavender',
  settings: {},
  isLoading: true,
  changeLanguage: () => {},
  toggleTheme:    () => {},
  setThemeMode:   () => {},
  setAccentColor: () => {},
  t: (key) => key,
};

const AppContext = createContext(defaultContextValue);

export function AppProvider({ children }) {
  const systemColorScheme = useColorScheme();

  const [language,       setLanguage]       = useState(DEFAULT_LANGUAGE);
  const [themeMode,      setThemeModeState] = useState('system');
  const [accentColor,    setAccentColorState] = useState('lavender');
  const [settings,       setSettings]       = useState({});
  const [isLoading,      setIsLoading]      = useState(true);

  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  const theme  = buildThemeWithAccent(isDark, accentColor);

  const t = useCallback((key, params = {}) => translate(key, language, params), [language]);

  // Tải cài đặt từ MMKV khi khởi động
  useEffect(() => {
    (async () => {
      try {
        const [savedLang, savedTheme, savedAccent, savedSettings] = await Promise.all([
          mmkvGet(CACHE_KEYS.LANGUAGE),
          mmkvGet(CACHE_KEYS.THEME),
          mmkvGet(CACHE_KEYS.ACCENT),
          mmkvGet('cache:settings'),
        ]);

        if (savedLang && Object.values(LANGUAGES).includes(savedLang)) setLanguage(savedLang);
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) setThemeModeState(savedTheme);
        if (savedAccent && ACCENT_PRESETS.find(p => p.id === savedAccent)) setAccentColorState(savedAccent);
        if (savedSettings) setSettings(savedSettings);
      } catch (err) {
        console.error('[AppContext] Lỗi tải cài đặt:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const changeLanguage = useCallback(async (newLang) => {
    if (!Object.values(LANGUAGES).includes(newLang)) throw new Error(`Ngôn ngữ không hỗ trợ: ${newLang}`);
    setLanguage(newLang);
    await mmkvSet(CACHE_KEYS.LANGUAGE, newLang);
  }, []);

  const toggleTheme = useCallback(async () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeModeState(newMode);
    await mmkvSet(CACHE_KEYS.THEME, newMode);
  }, [isDark]);

  const setThemeMode = useCallback(async (mode) => {
    if (!['light', 'dark', 'system'].includes(mode)) throw new Error(`Theme mode không hợp lệ: ${mode}`);
    setThemeModeState(mode);
    await mmkvSet(CACHE_KEYS.THEME, mode);
  }, []);

  const setAccentColor = useCallback(async (accentId) => {
    if (!ACCENT_PRESETS.find(p => p.id === accentId)) throw new Error(`Accent không hợp lệ: ${accentId}`);
    setAccentColorState(accentId);
    await mmkvSet(CACHE_KEYS.ACCENT, accentId);
  }, []);

  const updateSetting = useCallback(async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await mmkvSet('cache:settings', newSettings);
  }, [settings]);

  return (
    <AppContext.Provider value={{
      language, theme, isDark, themeMode, accentColor, settings, isLoading,
      changeLanguage, toggleTheme, setThemeMode, setAccentColor, updateSetting, t,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('[AppContext] useApp phải được dùng bên trong AppProvider');
  return ctx;
}

export default AppContext;
