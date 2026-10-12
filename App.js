// App.js - Entry point của ứng dụng Memmori
import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Import các Context providers
import { AuthProvider } from './src/context/AuthContext';
import { AppProvider, useApp } from './src/context/AppContext';
import { MemoryProvider } from './src/context/MemoryContext';
import { RequirementsProvider } from './src/context/RequirementsContext';
import { NotificationProvider } from './src/context/NotificationContext';

// Màn hình chặn khi thiếu mạng / GPS
import RequirementsGate from './src/components/RequirementsGate';

// Import navigator
import AppNavigator from './src/navigation/AppNavigator';

// Fonts chuẩn cho React Navigation
const NAV_FONTS = {
  regular: { fontFamily: 'System', fontWeight: '400' },
  medium:  { fontFamily: 'System', fontWeight: '500' },
  bold:    { fontFamily: 'System', fontWeight: '700' },
  heavy:   { fontFamily: 'System', fontWeight: '800' },
};

// ===== ERROR BOUNDARY =====
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Lỗi không xử lý được:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errStyles.container}>
          <Text style={errStyles.emoji}>😵</Text>
          <Text style={errStyles.title}>Ứng dụng gặp sự cố</Text>
          <Text style={errStyles.message}>
            {this.state.error?.message || 'Lỗi không xác định'}
          </Text>
          <TouchableOpacity
            style={errStyles.btn}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={errStyles.btnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const errStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#F0F6FF' },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#0F1E3D', marginBottom: 8 },
  message: { fontSize: 13, color: '#4A5C7A', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  btn: { backgroundColor: '#1A6FD4', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

// Component bao bọc để dùng theme từ AppContext
function AppContent() {
  const { theme, isDark } = useApp();

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
    <ErrorBoundary>
      <SafeAreaProvider>
        <RequirementsProvider>
          <AppProvider>
            <AuthProvider>
              <MemoryProvider>
                <NotificationProvider>
                <ErrorBoundary>
                  {/* RequirementsGate chặn toàn bộ app nếu thiếu mạng hoặc GPS */}
                  <RequirementsGate>
                    <AppContent />
                  </RequirementsGate>
                </ErrorBoundary>
                </NotificationProvider>
              </MemoryProvider>
            </AuthProvider>
          </AppProvider>
        </RequirementsProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
