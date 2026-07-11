// src/theme/index.js - MemoryMap Blue Theme

// ===== PALETTE XANH DƯƠNG =====
const COLORS = {
  // Primary - Xanh dương đậm (Ocean Blue)
  primary:      '#1A6FD4',  // Xanh dương chính
  primaryLight: '#4B96F3',  // Xanh dương nhạt
  primaryDark:  '#0D4FA0',  // Xanh dương tối
  primarySoft:  '#E8F1FD',  // Xanh dương rất nhạt (background highlight)

  // Secondary - Xanh ngọc (Teal)
  secondary:      '#0EA5C9', // Teal/Cyan
  secondaryLight: '#67D7EF',
  secondaryDark:  '#0A7A97',

  // Accent - Xanh sky
  accent: '#38BDF8',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error:   '#EF4444',
  info:    '#3B82F6',

  // Neutral
  white: '#FFFFFF',
  black: '#000000',

  // Map
  mapMarker: '#1A6FD4',
};

// ===== LIGHT THEME =====
export const lightTheme = {
  dark: false,
  colors: {
    background:   '#F0F6FF',  // Nền xanh rất nhạt
    surface:      '#FFFFFF',
    card:         '#FFFFFF',

    text:         '#0F1E3D',  // Navy đậm
    textSecondary:'#4A5C7A',
    textTertiary: '#8FA3C0',
    textInverse:  '#FFFFFF',

    primary:      COLORS.primary,
    primaryLight: COLORS.primaryLight,
    primaryDark:  COLORS.primaryDark,
    primarySoft:  COLORS.primarySoft,

    secondary:      COLORS.secondary,
    secondaryLight: COLORS.secondaryLight,
    secondaryDark:  COLORS.secondaryDark,

    accent: COLORS.accent,

    success: COLORS.success,
    warning: COLORS.warning,
    error:   COLORS.error,
    info:    COLORS.info,

    border:      '#D0DFEF',
    divider:     '#E8F0FA',
    placeholder: '#6B85A0',  // đậm hơn - dễ đọc WCAG AA
    disabled:    '#C8D8EC',

    tabBar:        '#FFFFFF',
    tabBarActive:  COLORS.primary,
    tabBarInactive:'#8FA3C0',
    tabBarBorder:  '#D0DFEF',

    inputBackground:  '#FFFFFF',  // trắng tinh - ô rõ hơn
    inputBorder:      '#A8BFD8',  // đậm hơn để thấy rõ border
    inputFocusBorder: COLORS.primary,

    buttonPrimary:     COLORS.primary,
    buttonSecondary:   COLORS.secondary,
    buttonDisabled:    '#C8D8EC',
    buttonText:        '#FFFFFF',
    buttonTextDisabled:'#8FA3C0',

    cardShadow: 'rgba(26,111,212,0.08)',
    cardBorder: '#D0DFEF',

    header:     '#FFFFFF',
    headerText: '#0F1E3D',
    headerBorder:'#D0DFEF',

    icon:       '#4A5C7A',
    iconActive: COLORS.primary,

    overlay:      'rgba(15,30,61,0.5)',
    overlayLight: 'rgba(15,30,61,0.2)',

    mapMarker: COLORS.mapMarker,

    chatBubbleSelf:  COLORS.primary,
    chatBubbleOther: '#EAF2FF',
    chatTextSelf:    '#FFFFFF',
    chatTextOther:   '#0F1E3D',

    gradientStart: '#1A6FD4',
    gradientEnd:   '#0EA5C9',

    skeleton:  '#D0DFEF',
    highlight: 'rgba(26,111,212,0.08)',

    white: '#FFFFFF',
    black: '#000000',
  },

  typography: {
    fontSize: {
      xs: 10, sm: 12, md: 14, base: 16,
      lg: 18, xl: 20, '2xl': 24, '3xl': 28, '4xl': 32,
    },
    fontWeight: {
      light: '300', normal: '400', medium: '500',
      semibold: '600', bold: '700', extrabold: '800',
    },
    lineHeight: { tight: 1.2, normal: 1.5, relaxed: 1.75 },
  },

  spacing: {
    xs: 4, sm: 8, md: 12, base: 16,
    lg: 20, xl: 24, '2xl': 32, '3xl': 40, '4xl': 48, '5xl': 64,
  },

  borderRadius: {
    sm: 4, md: 8, lg: 12, xl: 16,
    '2xl': 20, '3xl': 24, full: 9999,
  },

  shadows: {
    sm: {
      shadowColor: '#1A6FD4',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 1,
    },
    md: {
      shadowColor: '#1A6FD4',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: '#1A6FD4',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.14,
      shadowRadius: 14,
      elevation: 6,
    },
    xl: {
      shadowColor: '#1A6FD4',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.22,
      shadowRadius: 16,
      elevation: 10,
    },
  },
};

// ===== DARK THEME =====
export const darkTheme = {
  dark: true,
  colors: {
    background:   '#060E1F',  // Đêm xanh đen
    surface:      '#0D1B35',
    card:         '#111F3F',

    text:         '#E8F0FF',
    textSecondary:'#8FA8CC',
    textTertiary: '#4A6080',
    textInverse:  '#0D1B35',

    primary:      COLORS.primaryLight,
    primaryLight: '#7DB8FF',
    primaryDark:  COLORS.primary,
    primarySoft:  'rgba(75,150,243,0.15)',

    secondary:      COLORS.secondaryLight,
    secondaryLight: '#9BE8F8',
    secondaryDark:  COLORS.secondary,

    accent: COLORS.accent,

    success: '#34D399',
    warning: '#FBBF24',
    error:   '#F87171',
    info:    '#60A5FA',

    border:      '#1C3060',
    divider:     '#152550',
    placeholder: '#4A6080',
    disabled:    '#1C3060',

    tabBar:        '#0D1B35',
    tabBarActive:  COLORS.primaryLight,
    tabBarInactive:'#4A6080',
    tabBarBorder:  '#1C3060',

    inputBackground:  '#152550',
    inputBorder:      '#1C3060',
    inputFocusBorder: COLORS.primaryLight,

    buttonPrimary:     COLORS.primaryLight,
    buttonSecondary:   COLORS.secondaryLight,
    buttonDisabled:    '#1C3060',
    buttonText:        '#060E1F',
    buttonTextDisabled:'#4A6080',

    cardShadow: 'rgba(0,0,0,0.4)',
    cardBorder: '#1C3060',

    header:      '#0D1B35',
    headerText:  '#E8F0FF',
    headerBorder:'#1C3060',

    icon:       '#8FA8CC',
    iconActive: COLORS.primaryLight,

    overlay:      'rgba(0,0,0,0.7)',
    overlayLight: 'rgba(0,0,0,0.4)',

    mapMarker: COLORS.primaryLight,

    chatBubbleSelf:  COLORS.primaryLight,
    chatBubbleOther: '#152550',
    chatTextSelf:    '#060E1F',
    chatTextOther:   '#E8F0FF',

    gradientStart: '#4B96F3',
    gradientEnd:   '#67D7EF',

    skeleton:  '#1C3060',
    highlight: 'rgba(75,150,243,0.15)',

    white: '#FFFFFF',
    black: '#000000',
  },

  typography: lightTheme.typography,
  spacing:    lightTheme.spacing,
  borderRadius: lightTheme.borderRadius,

  shadows: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.25, shadowRadius: 3, elevation: 1 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 3 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 6 },
    xl: { shadowColor: COLORS.primaryLight, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 10 },
  },
};

export function getTheme(isDark = false) {
  return isDark ? darkTheme : lightTheme;
}

export default { light: lightTheme, dark: darkTheme, getTheme, COLORS };
