// App.js - Entry point của ứng dụng MemoryMap
import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import các Context providers
import { AuthProvider } from './src/context/AuthContext';
import { AppProvider, useApp } from './src/context/AppContext';
import { MemoryProvider } from './src/context/MemoryContext';

// Import navigator
import AppNavigator from './src/navigation/AppNavigator';

// Fonts chuẩn cho React Navigation
const NAV_FONTS = {
  regular: { fontFamily: 'System', fontWeight: '400' },
  medium:  { fontFamily: 'System', fontWeight: '500' },
  bold:    { fontFamily: 'System', fontWeight: '700' },
  heavy:   { fontFamily: 'System', fontWeight: '800' },
};

// Component bao bọc để dùng theme từ AppContext
function AppContent() {
  const { theme, isDark } = useApp();

  // Xây dựng navigation theme đúng chuẩn React Navigation v7
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    fonts: NAV_FONTS,
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary:      theme.colors.primary,
      background:   theme.colors.background,
      card:         theme.colors.card,
      text:         theme.colors.text,
      border:       theme.colors.border,
      notification: theme.colors.primary,
    },
  };

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer theme={navTheme}>
        <AppNavigator />
      </NavigationContainer>
    </>
  );
}

// Root component
export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AuthProvider>
          <MemoryProvider>
            <AppContent />
          </MemoryProvider>
        </AuthProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
