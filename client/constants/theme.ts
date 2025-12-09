import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#1A1A1A",
    textSecondary: "#4A5568",
    textTertiary: "#6B7280",
    textOnPrimary: "#FFFFFF",
    textOnAccent: "#FFFFFF",
    buttonText: "#FFFFFF",
    tabIconDefault: "#6B7280",
    tabIconSelected: "#FF6B2C",
    link: "#1F3650",
    backgroundRoot: "#F0F2F5",
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#E2E6EB",
    backgroundTertiary: "#C8CED6",
    primary: "#1F3650",
    primaryLight: "#2D4A6A",
    accent: "#FF6B2C",
    accentLight: "#FF8F5C",
    statusIdle: "#6B7280",
    statusOpen: "#6B7280",
    statusInProgress: "#2563EB",
    statusCompleted: "#16A34A",
    statusCancelled: "#DC2626",
    fillLow: "#16A34A",
    fillMedium: "#EA580C",
    fillHigh: "#DC2626",
    border: "#C8CED6",
    error: "#DC2626",
    warning: "#EA580C",
    warningLight: "#F59E0B",
    success: "#16A34A",
    cardSurface: "#FFFFFF",
    cardBorder: "#D1D5DB",
  },
  dark: {
    text: "#F5F5F5",
    textSecondary: "#B0B8C1",
    textTertiary: "#8A95A6",
    textOnPrimary: "#FFFFFF",
    textOnAccent: "#FFFFFF",
    buttonText: "#FFFFFF",
    tabIconDefault: "#8A95A6",
    tabIconSelected: "#FF6B2C",
    link: "#60A5FA",
    backgroundRoot: "#0A0F14",
    backgroundDefault: "#141A22",
    backgroundSecondary: "#1E2530",
    backgroundTertiary: "#2A333F",
    primary: "#3B5A7C",
    primaryLight: "#4A6F94",
    accent: "#FF6B2C",
    accentLight: "#FF8F5C",
    statusIdle: "#8A95A6",
    statusOpen: "#8A95A6",
    statusInProgress: "#3B82F6",
    statusCompleted: "#22C55E",
    statusCancelled: "#EF4444",
    fillLow: "#22C55E",
    fillMedium: "#F97316",
    fillHigh: "#EF4444",
    border: "#2A333F",
    error: "#EF4444",
    warning: "#F97316",
    warningLight: "#FBBF24",
    success: "#22C55E",
    cardSurface: "#141A22",
    cardBorder: "#2A333F",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 52,
  buttonHeight: 56,
  buttonHeightSmall: 48,
  tabBarHeight: 64,
  touchTargetMin: 48,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  smallBold: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
  },
  captionBold: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  button: {
    fontSize: 16,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  link: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "Roboto, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Shadows = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const IndustrialDesign = {
  minTouchTarget: 48,
  buttonHeight: 56,
  buttonHeightSmall: 48,
  borderWidth: 2,
  iconSize: 24,
  iconSizeLarge: 32,
  cardPadding: 16,
  listItemHeight: 72,
};
