// src/theme/index.js - Định nghĩa Light/Dark theme cho toàn app

// ===== MÀU SẮC CHÍNH =====
const COLORS = {
  // Primary brand colors
  primary: '#E84393',      // Hồng đậm - màu chủ đạo
  primaryLight: '#FF6BB5', // Hồng nhạt
  primaryDark: '#C0185A',  // Hồng đậm hơn
  
  // Secondary colors
  secondary: '#6C5CE7',    // Tím
  secondaryLight: '#A29BFE',
  
  // Accent
  accent: '#FD79A8',       // Hồng pastel
  
  // Status colors
  success: '#00B894',      // Xanh lá
  warning: '#FDCB6E',      // Vàng
  error: '#D63031',        // Đỏ
  info: '#0984E3',         // Xanh dương
  
  // Neutral
  white: '#FFFFFF',
  black: '#000000',
  
  // Map colors
  mapMarker: '#E84393',
};

// ===== LIGHT THEME =====
export const lightTheme = {
  dark: false,
  colors: {
    // Backgrounds
    background: '#F8F9FE',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    
    // Text
    text: '#2D3436',
    textSecondary: '#636E72',
    textTertiary: '#B2BEC3',
    textInverse: '#FFFFFF',
    
    // Primary
    primary: COLORS.primary,
    primaryLight: COLORS.primaryLight,
    primaryDark: COLORS.primaryDark,
    
    // Secondary
    secondary: COLORS.secondary,
    secondaryLight: COLORS.secondaryLight,
    
    // Accent
    accent: COLORS.accent,
    
    // Status
    success: COLORS.success,
    warning: COLORS.warning,
    error: COLORS.error,
    info: COLORS.info,
    
    // UI Elements
    border: '#E0E3EB',
    divider: '#F1F3F8',
    placeholder: '#B2BEC3',
    disabled: '#DFE6E9',
    
    // Tab bar
    tabBar: '#FFFFFF',
    tabBarActive: COLORS.primary,
    tabBarInactive: '#B2BEC3',
    tabBarBorder: '#E0E3EB',
    
    // Input
    inputBackground: '#F5F6FA',
    inputBorder: '#E0E3EB',
    inputFocusBorder: COLORS.primary,
    
    // Button
    buttonPrimary: COLORS.primary,
    buttonSecondary: COLORS.secondary,
    buttonDisabled: '#DFE6E9',
    buttonText: '#FFFFFF',
    buttonTextDisabled: '#B2BEC3',
    
    // Card
    cardShadow: 'rgba(0,0,0,0.08)',
    cardBorder: '#E0E3EB',
    
    // Header
    header: '#FFFFFF',
    headerText: '#2D3436',
    headerBorder: '#E0E3EB',
    
    // Icons
    icon: '#636E72',
    iconActive: COLORS.primary,
    
    // Overlay
    overlay: 'rgba(0,0,0,0.5)',
    overlayLight: 'rgba(0,0,0,0.2)',
    
    // Map
    mapMarker: COLORS.mapMarker,
    
    // Chat
    chatBubbleSelf: COLORS.primary,
    chatBubbleOther: '#F1F3F8',
    chatTextSelf: '#FFFFFF',
    chatTextOther: '#2D3436',
    
    // Gradient stops
    gradientStart: '#E84393',
    gradientEnd: '#6C5CE7',
    
    // Misc
    skeleton: '#E0E3EB',
    highlight: 'rgba(232, 67, 147, 0.1)',
    
    // White/Black
    white: '#FFFFFF',
    black: '#000000',
  },
  
  // Typography
  typography: {
    fontSize: {
      xs: 10,
      sm: 12,
      md: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 28,
      '4xl': 32,
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 64,
  },
  
  // Border radius
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    full: 9999,
  },
  
  // Shadows
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
    },
    xl: {
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};

// ===== DARK THEME =====
export const darkTheme = {
  dark: true,
  colors: {
    // Backgrounds
    background: '#0F0F1A',
    surface: '#1A1A2E',
    card: '#1E1E30',
    
    // Text
    text: '#F0F0F5',
    textSecondary: '#A0A0B8',
    textTertiary: '#60607A',
    textInverse: '#1A1A2E',
    
    // Primary
    primary: COLORS.primaryLight,
    primaryLight: '#FFB3D6',
    primaryDark: COLORS.primary,
    
    // Secondary
    secondary: COLORS.secondaryLight,
    secondaryLight: '#C9C4FF',
    
    // Accent
    accent: COLORS.accent,
    
    // Status
    success: '#00CFA5',
    warning: '#FDCB6E',
    error: '#FF6B6B',
    info: '#54A0FF',
    
    // UI Elements
    border: '#2A2A40',
    divider: '#252538',
    placeholder: '#60607A',
    disabled: '#2A2A40',
    
    // Tab bar
    tabBar: '#1A1A2E',
    tabBarActive: COLORS.primaryLight,
    tabBarInactive: '#60607A',
    tabBarBorder: '#2A2A40',
    
    // Input
    inputBackground: '#252538',
    inputBorder: '#2A2A40',
    inputFocusBorder: COLORS.primaryLight,
    
    // Button
    buttonPrimary: COLORS.primaryLight,
    buttonSecondary: COLORS.secondaryLight,
    buttonDisabled: '#2A2A40',
    buttonText: '#0F0F1A',
    buttonTextDisabled: '#60607A',
    
    // Card
    cardShadow: 'rgba(0,0,0,0.3)',
    cardBorder: '#2A2A40',
    
    // Header
    header: '#1A1A2E',
    headerText: '#F0F0F5',
    headerBorder: '#2A2A40',
    
    // Icons
    icon: '#A0A0B8',
    iconActive: COLORS.primaryLight,
    
    // Overlay
    overlay: 'rgba(0,0,0,0.7)',
    overlayLight: 'rgba(0,0,0,0.4)',
    
    // Map
    mapMarker: COLORS.primaryLight,
    
    // Chat
    chatBubbleSelf: COLORS.primaryLight,
    chatBubbleOther: '#252538',
    chatTextSelf: '#0F0F1A',
    chatTextOther: '#F0F0F5',
    
    // Gradient stops
    gradientStart: '#FF6BB5',
    gradientEnd: '#A29BFE',
    
    // Misc
    skeleton: '#2A2A40',
    highlight: 'rgba(255, 107, 181, 0.15)',
    
    // White/Black
    white: '#FFFFFF',
    black: '#000000',
  },
  
  // Typography (giống light theme)
  typography: lightTheme.typography,
  
  // Spacing (giống light theme)
  spacing: lightTheme.spacing,
  
  // Border radius (giống light theme)
  borderRadius: lightTheme.borderRadius,
  
  // Shadows (tối hơn cho dark mode)
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
    },
    xl: {
      shadowColor: COLORS.primaryLight,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};

// Helper để lấy theme theo tên
export function getTheme(isDark = false) {
  return isDark ? darkTheme : lightTheme;
}

export default {
  light: lightTheme,
  dark: darkTheme,
  getTheme,
  COLORS,
};
