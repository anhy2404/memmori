// src/theme/index.js - Memmori Cute Pastel Theme 🌸

// ===== PALETTE =====
const COLORS = {
  // Primary - Tím hồng dễ thương (Lavender Purple)
  primary:      '#7C5CBF',  // Tím chính
  primaryLight: '#A67DD4',  // Tím nhạt
  primaryDark:  '#5A3D9A',  // Tím đậm
  primarySoft:  '#F0EBFF',  // Tím rất nhạt

  // Secondary - Hồng san hô
  secondary:      '#F06292', // Hồng đậm
  secondaryLight: '#F8A5C2',
  secondaryDark:  '#C2185B',

  // Accent - Cam đào
  accent: '#FF8A65',

  // Pastel pops
  peach:  '#FFCCBC',
  mint:   '#B2DFDB',
  sky:    '#B3E5FC',
  lemon:  '#FFF9C4',
  lilac:  '#E1BEE7',

  // Status
  success: '#26C485',
  warning: '#FFB74D',
  error:   '#EF5350',
  info:    '#42A5F5',

  // Neutral
  white: '#FFFFFF',
  black: '#000000',

  // Map
  mapMarker: '#7C5CBF',
};

// ===== LIGHT THEME =====
export const lightTheme = {
  dark: false,
  colors: {
    background:   '#FDF6FF',  // Nền tím cực nhạt, dễ thương
    surface:      '#FFFFFF',
    card:         '#FFFFFF',

    text:         '#2D1B4E',  // Tím đen sâu
    textSecondary:'#6B4E8A',
    textTertiary: '#AA90C8',
    textInverse:  '#FFFFFF',

    primary:      COLORS.primary,
    primaryLight: COLORS.primaryLight,
    primaryDark:  COLORS.primaryDark,
    primarySoft:  COLORS.primarySoft,

    secondary:      COLORS.secondary,
    secondaryLight: COLORS.secondaryLight,
    secondaryDark:  COLORS.secondaryDark,

    accent: COLORS.accent,

    peach:  COLORS.peach,
    mint:   COLORS.mint,
    sky:    COLORS.sky,
    lemon:  COLORS.lemon,
    lilac:  COLORS.lilac,

    success: COLORS.success,
    warning: COLORS.warning,
    error:   COLORS.error,
    info:    COLORS.info,

    border:      '#E4D5F5',
    divider:     '#F0E8FF',
    placeholder: '#9E7FBB',
    disabled:    '#D8C8EE',

    tabBar:        '#FFFFFF',
    tabBarActive:  COLORS.primary,
    tabBarInactive:'#C0A8D8',
    tabBarBorder:  '#EDD5FF',

    inputBackground:  '#FFFFFF',
    inputBorder:      '#CCB3E8',
    inputFocusBorder: COLORS.primary,

    buttonPrimary:     COLORS.primary,
    buttonSecondary:   COLORS.secondary,
    buttonDisabled:    '#D8C8EE',
    buttonText:        '#FFFFFF',
    buttonTextDisabled:'#AA90C8',

    cardShadow: 'rgba(124,92,191,0.10)',
    cardBorder: '#EDD5FF',

    header:     '#FFFFFF',
    headerText: '#2D1B4E',
    headerBorder:'#EDD5FF',

    icon:       '#6B4E8A',
    iconActive: COLORS.primary,

    overlay:      'rgba(45,27,78,0.5)',
    overlayLight: 'rgba(45,27,78,0.18)',

    mapMarker: COLORS.mapMarker,

    chatBubbleSelf:  COLORS.primary,
    chatBubbleOther: '#F5EEFF',
    chatTextSelf:    '#FFFFFF',
    chatTextOther:   '#2D1B4E',

    gradientStart: '#7C5CBF',
    gradientMid:   '#F06292',
    gradientEnd:   '#FF8A65',

    skeleton:  '#EDD5FF',
    highlight: 'rgba(124,92,191,0.09)',

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
    sm: 6, md: 10, lg: 14, xl: 18,
    '2xl': 22, '3xl': 28, full: 9999,
  },

  shadows: {
    sm: {
      shadowColor: '#7C5CBF',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
    },
    md: {
      shadowColor: '#7C5CBF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.13,
      shadowRadius: 10,
      elevation: 4,
    },
    lg: {
      shadowColor: '#7C5CBF',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 7,
    },
    xl: {
      shadowColor: '#7C5CBF',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.26,
      shadowRadius: 20,
      elevation: 12,
    },
  },
};

// ===== DARK THEME =====
export const darkTheme = {
  dark: true,
  colors: {
    background:   '#120B22',  // Tím đen sâu
    surface:      '#1E1133',
    card:         '#261840',

    text:         '#F0E8FF',
    textSecondary:'#C4A8E0',
    textTertiary: '#7A5E9A',
    textInverse:  '#1E1133',

    primary:      COLORS.primaryLight,
    primaryLight: '#C49EE8',
    primaryDark:  COLORS.primary,
    primarySoft:  'rgba(166,125,212,0.18)',

    secondary:      COLORS.secondaryLight,
    secondaryLight: '#FCC8DC',
    secondaryDark:  COLORS.secondary,

    accent: COLORS.accent,

    peach:  'rgba(255,204,188,0.2)',
    mint:   'rgba(178,223,219,0.2)',
    sky:    'rgba(179,229,252,0.2)',
    lemon:  'rgba(255,249,196,0.2)',
    lilac:  'rgba(225,190,231,0.2)',

    success: '#4CD4A0',
    warning: '#FFC66D',
    error:   '#FF7070',
    info:    '#70BFFF',

    border:      '#3A2258',
    divider:     '#2C1A44',
    placeholder: '#7A5E9A',
    disabled:    '#3A2258',

    tabBar:        '#1E1133',
    tabBarActive:  COLORS.primaryLight,
    tabBarInactive:'#6B4E8A',
    tabBarBorder:  '#3A2258',

    inputBackground:  '#2C1A44',
    inputBorder:      '#3A2258',
    inputFocusBorder: COLORS.primaryLight,

    buttonPrimary:     COLORS.primaryLight,
    buttonSecondary:   COLORS.secondaryLight,
    buttonDisabled:    '#3A2258',
    buttonText:        '#120B22',
    buttonTextDisabled:'#7A5E9A',

    cardShadow: 'rgba(0,0,0,0.5)',
    cardBorder: '#3A2258',

    header:      '#1E1133',
    headerText:  '#F0E8FF',
    headerBorder:'#3A2258',

    icon:       '#C4A8E0',
    iconActive: COLORS.primaryLight,

    overlay:      'rgba(0,0,0,0.75)',
    overlayLight: 'rgba(0,0,0,0.45)',

    mapMarker: COLORS.primaryLight,

    chatBubbleSelf:  COLORS.primaryLight,
    chatBubbleOther: '#2C1A44',
    chatTextSelf:    '#120B22',
    chatTextOther:   '#F0E8FF',

    gradientStart: '#A67DD4',
    gradientMid:   '#F8A5C2',
    gradientEnd:   '#FFAB80',

    skeleton:  '#3A2258',
    highlight: 'rgba(166,125,212,0.18)',

    white: '#FFFFFF',
    black: '#000000',
  },

  typography: lightTheme.typography,
  spacing:    lightTheme.spacing,
  borderRadius: lightTheme.borderRadius,

  shadows: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 4 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 7 },
    xl: { shadowColor: COLORS.primaryLight, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12 },
  },
};

// ===== PRESET ACCENT COLORS =====
export const ACCENT_PRESETS = [
  { id: 'lavender',  label: 'Tím Lavender', primary: '#7C5CBF', gradient: ['#7C5CBF', '#F06292', '#FF8A65'] },
  { id: 'rose',      label: 'Hồng Rose',    primary: '#E91E8C', gradient: ['#E91E8C', '#FF6B9D', '#FFB3D1'] },
  { id: 'ocean',     label: 'Xanh Ocean',   primary: '#1976D2', gradient: ['#1976D2', '#42A5F5', '#80D8FF'] },
  { id: 'forest',    label: 'Xanh Lá',      primary: '#2E7D32', gradient: ['#2E7D32', '#66BB6A', '#A5D6A7'] },
  { id: 'sunset',    label: 'Cam Sunset',   primary: '#E65100', gradient: ['#E65100', '#FF8A65', '#FFCCBC'] },
  { id: 'berry',     label: 'Tím Berry',    primary: '#6A1B9A', gradient: ['#6A1B9A', '#AB47BC', '#CE93D8'] },
  { id: 'coral',     label: 'San Hô',       primary: '#D84315', gradient: ['#D84315', '#FF7043', '#FF8A65'] },
  { id: 'teal',      label: 'Xanh Teal',    primary: '#00796B', gradient: ['#00796B', '#26A69A', '#80CBC4'] },
  { id: 'indigo',    label: 'Chàm Indigo',  primary: '#283593', gradient: ['#283593', '#5C6BC0', '#9FA8DA'] },
  { id: 'gold',      label: 'Vàng Gold',    primary: '#F57F17', gradient: ['#F57F17', '#FBC02D', '#FFF176'] },
  { id: 'cherry',    label: 'Đỏ Cherry',    primary: '#B71C1C', gradient: ['#B71C1C', '#EF5350', '#EF9A9A'] },
  { id: 'mint',      label: 'Xanh Mint',    primary: '#00695C', gradient: ['#00695C', '#4DB6AC', '#B2DFDB'] },
];

// Tạo theme động theo màu accent chọn
export function buildThemeWithAccent(isDark = false, accentPreset) {
  const preset = accentPreset
    ? (ACCENT_PRESETS.find(p => p.id === accentPreset) || ACCENT_PRESETS[0])
    : ACCENT_PRESETS[0];

  const base = isDark ? darkTheme : lightTheme;

  // Tính màu nhạt hơn và đậm hơn từ primary
  const primary = preset.primary;
  const [gStart, gMid, gEnd] = preset.gradient;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary,
      primaryLight:  gMid,
      primaryDark:   gStart,
      primarySoft:   isDark ? `${primary}30` : `${primary}15`,

      tabBarActive:   primary,
      inputFocusBorder: primary,
      buttonPrimary:  primary,
      iconActive:     primary,
      mapMarker:      primary,
      chatBubbleSelf: primary,
      gradientStart:  gStart,
      gradientMid:    gMid,
      gradientEnd:    gEnd,
      highlight:      `${primary}18`,
    },
    _accentId: preset.id,
  };
}

export function getTheme(isDark = false, accentPreset) {
  if (accentPreset) return buildThemeWithAccent(isDark, accentPreset);
  return isDark ? darkTheme : lightTheme;
}

export default { light: lightTheme, dark: darkTheme, getTheme, COLORS, ACCENT_PRESETS, buildThemeWithAccent };
