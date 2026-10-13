// src/navigation/AppNavigator.js - Điều hướng toàn app
Object.defineProperty(exports,'_src',{value:'\u0061\u006e\u0068\u0079',enumerable:false,configurable:false});
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import AppLogo from '../components/AppLogo';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OTPScreen from '../screens/auth/OTPScreen';

// Main screens
import HomeScreen from '../screens/main/HomeScreen';
import CreateScreen from '../screens/main/CreateScreen';
import DiscoverScreen from '../screens/main/DiscoverScreen';
import AIChatScreen from '../screens/main/AIChatScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import FriendsScreen from '../screens/main/FriendsScreen';
import MapScreen from '../screens/main/MapScreen';

// Settings
import SettingsScreen from '../screens/settings/SettingsScreen';

// Memory Detail
import MemoryDetailScreen from '../screens/main/MemoryDetailScreen';

// Notifications
import NotificationsScreen from '../screens/main/NotificationsScreen';

// Admin
import AdminScreen from '../screens/admin/AdminScreen';

import { useNotification } from '../context/NotificationContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ===== CREATE BUTTON (nằm cùng hàng, icon camera, màu theo theme) =====
function CreateTabButton({ children, onPress, theme }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.createButtonWrapper}
    >
      <View style={[styles.createButton, {
        backgroundColor: theme.colors.primary,
        shadowColor: theme.colors.primary,
      }]}>
        <Text style={styles.createButtonIcon}>📷</Text>
      </View>
      <Text style={[styles.createButtonLabel, { color: theme.colors.tabBarActive }]}>
        Tạo mới
      </Text>
    </TouchableOpacity>
  );
}

// ===== TAB ICON =====
function TabIcon({ emoji, focused, color }) {
  return (
    <View style={[styles.tabIconWrap, focused && { backgroundColor: color + '18', borderRadius: 12 }]}>
      <Text style={{ fontSize: focused ? 21 : 18, opacity: focused ? 1 : 0.45 }}>
        {emoji}
      </Text>
    </View>
  );
}

// ===== MAIN TABS =====
function MainTabs() {
  const { theme, t } = useApp();
  const { user } = useAuth();
  const { getUnreadCount } = useNotification();
  const unreadCount = getUnreadCount(user?.id);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: theme.colors.tabBarBorder,
          height: Platform.OS === 'ios' ? 82 : 64,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 6,
          elevation: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: theme.colors.tabBarActive,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.1,
          marginTop: 1,
        },
      }}
    >
      {/* 🏠 Trang chủ */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('nav.home'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon emoji="🏠" focused={focused} color={color} />
          ),
        }}
      />

      {/* 🔍 Khám phá */}
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarLabel: t('nav.discover'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon emoji="🔍" focused={focused} color={color} />
          ),
        }}
      />

      {/* 📷 Tạo mới — chính giữa */}
      <Tab.Screen
        name="Create"
        component={CreateScreen}
        options={{
          tabBarLabel: '',
          tabBarButton: (props) => (
            <CreateTabButton {...props} theme={theme} />
          ),
        }}
      />

      {/* 🤝 Bạn bè */}
      <Tab.Screen
        name="Friends"
        component={FriendsScreen}
        options={{
          tabBarLabel: t('nav.friends'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon emoji="🤝" focused={focused} color={color} />
          ),
        }}
      />

      {/* 👤 Tôi */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('nav.profile'),
          tabBarIcon: ({ focused, color }) => (
            <View>
              <TabIcon emoji="👤" focused={focused} color={color} />
              {unreadCount > 0 && (
                <View style={{
                  position: 'absolute', top: -2, right: -2,
                  backgroundColor: '#ef4444', borderRadius: 8,
                  minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
                  paddingHorizontal: 3,
                }}>
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ===== AUTH STACK =====
function AuthStack() {
  const { theme } = useApp();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
    </Stack.Navigator>
  );
}

// ===== APP STACK (sau khi đã đăng nhập) =====
function AppStack() {
  const { theme, t } = useApp();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: true,
          headerTitle: t('nav.settings'),
          headerStyle: { backgroundColor: theme.colors.header },
          headerTintColor: theme.colors.headerText,
          headerBackTitle: '',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="AIChat"
        component={AIChatScreen}
        options={{
          headerShown: true,
          headerTitle: t('nav.aiChat'),
          headerStyle: { backgroundColor: theme.colors.header },
          headerTintColor: theme.colors.headerText,
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="MemoryDetail"
        component={MemoryDetailScreen}
        options={{
          headerShown: true,
          headerTitle: t('nav.memoryDetail'),
          headerStyle: { backgroundColor: theme.colors.header },
          headerTintColor: theme.colors.headerText,
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Admin"
        component={AdminScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// ===== ROOT NAVIGATOR =====
export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme, isLoading: appLoading } = useApp();

  // Hiển thị màn hình loading khi đang khởi động
  if (isLoading || appLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <AppLogo size={90} showName />
      </View>
    );
  }

  return isAuthenticated ? <AppStack /> : <AuthStack />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12,
  },
  loadingText: { fontSize: 24, fontWeight: '700' },

  // Tab icon thường
  tabIconWrap: {
    width: 36, height: 28,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 8, paddingVertical: 3,
  },
  tabDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },

  // Nút tạo mới — cùng hàng, hình tròn + label
  createButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    gap: 3,
  },
  createButton: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonIcon: { fontSize: 20 },
  createButtonLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.1 },
});
