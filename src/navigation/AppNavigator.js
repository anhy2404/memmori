// src/navigation/AppNavigator.js - Điều hướng toàn app
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main screens
import HomeScreen from '../screens/main/HomeScreen';
import MapScreen from '../screens/main/MapScreen';
import CreateScreen from '../screens/main/CreateScreen';
import DiscoverScreen from '../screens/main/DiscoverScreen';
import AIChatScreen from '../screens/main/AIChatScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

// Settings
import SettingsScreen from '../screens/settings/SettingsScreen';

// Memory Detail
import MemoryDetailScreen from '../screens/main/MemoryDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ===== CREATE BUTTON (nút + ở giữa tab) =====
function CreateTabButton({ children, onPress, theme }) {
  return (
    <TouchableOpacity
      style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.createButtonText}>+</Text>
    </TouchableOpacity>
  );
}

// ===== MAIN TABS =====
function MainTabs() {
  const { theme, t } = useApp();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.tabBarBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: theme.colors.tabBarActive,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: -2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('nav.home'),
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6 }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: t('nav.map'),
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6 }}>🗺️</Text>
          ),
        }}
      />
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
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarLabel: t('nav.discover'),
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6 }}>🔍</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('nav.profile'),
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6 }}>👤</Text>
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
        <Text style={{ fontSize: 40 }}>🗺️</Text>
        <Text style={[styles.loadingText, { color: theme.colors.primary }]}>MemoryMap</Text>
      </View>
    );
  }

  return isAuthenticated ? <AppStack /> : <AuthStack />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 24,
    fontWeight: '700',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderRadius: 12,
  },
  tabIconActive: {
    // Có thể thêm background highlight
  },
  createButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#E84393',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    top: -10,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
    marginTop: -2,
  },
});
